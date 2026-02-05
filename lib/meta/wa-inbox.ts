import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { resolveConnectionForWebhook } from "@/lib/meta/wa-connections";
import { evaluateRulesForThread } from "@/lib/meta/automation-engine";

// AI Auto-Reply is handled exclusively by the AI Reply Worker (scripts/ai-reply-worker.ts).
// The triggerAIReplyForMessage and checkAndTriggerAIReplies functions have been removed
// to prevent duplicate replies. Only the standalone worker polls for new messages.

type WaMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  interactive?: { nfm_reply?: { response_json?: { body?: string } } };
  image?: { id?: string };
  document?: { id?: string };
  audio?: { id?: string };
  video?: { id?: string };
};

type WaStatus = {
  id?: string;
  status?: string;
  timestamp?: string;
  errors?: Array<{ code?: string | number; title?: string; message?: string }>;
};

type WaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: WaMessage[];
        statuses?: WaStatus[];
      };
    }>;
  }>;
};

function toDate(ts?: string | null) {
  if (!ts) return null;
  const num = Number(ts);
  if (Number.isNaN(num)) return null;
  return new Date(num * 1000).toISOString();
}

export async function processWhatsappEvents(
  workspaceId: string,
  limit = 25,
  options?: { reconcile?: boolean; reconcileLimit?: number }
) {
  const db = supabaseAdmin();
  const { data: events, error } = await db
    .from("meta_webhook_events")
    .select("id, payload_json, received_at, event_key, workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .or("processed_at.is.null,error_text.not.is.null")
    .order("received_at", { ascending: true })
    .limit(limit);

  if (error) {
    logger.error("[wa-inbox] fetch events failed", { message: error.message });
    return { processed: 0 };
  }

  let processed = 0;
  let messagesCreated = 0;
  let threadsTouched = 0;
  let statusEvents = 0;
  let errors = 0;
  let reconciledEvents = 0;
  let reconciledMessages = 0;
  let reconciledThreads = 0;

  for (const evt of events ?? []) {
    const payload = (evt.payload_json || {}) as WaWebhookPayload;
    try {
      const eventWorkspaceId = evt.workspace_id ?? workspaceId;
      const result = await handlePayload(db, eventWorkspaceId, payload);
      messagesCreated += result.messagesCreated;
      threadsTouched += result.threadsTouched;
      statusEvents += result.statusEvents;
      await db
        .from("meta_webhook_events")
        .update({ processed_at: new Date().toISOString(), error_text: null })
        .eq("id", evt.id);
      processed += 1;
    } catch (err) {
      errors += 1;
      logger.warn("[wa-inbox] process failed", {
        id: evt.id,
        message: err instanceof Error ? err.message : "unknown",
      });
      await db
        .from("meta_webhook_events")
        .update({
          error_text: err instanceof Error ? err.message : "unknown",
          processed_at: null,
        })
        .eq("id", evt.id);
    }
  }

  if (options?.reconcile) {
    const { data: recentEvents, error: recentError } = await db
      .from("meta_webhook_events")
      .select("id, payload_json, received_at, workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("channel", "whatsapp")
      .order("received_at", { ascending: false })
      .limit(options.reconcileLimit ?? 100);

    if (recentError) {
      logger.warn("[wa-inbox] reconcile fetch failed", {
        message: recentError.message,
      });
    } else {
      for (const evt of recentEvents ?? []) {
        const payload = (evt.payload_json || {}) as WaWebhookPayload;
        try {
          const eventWorkspaceId = evt.workspace_id ?? workspaceId;
          const result = await handlePayload(db, eventWorkspaceId, payload);
          reconciledEvents += 1;
          reconciledMessages += result.messagesCreated;
          reconciledThreads += result.threadsTouched;
        } catch (err) {
          errors += 1;
          const message = err instanceof Error ? err.message : "unknown";
          logger.warn("[wa-inbox] reconcile failed", { id: evt.id, message });
          await db
            .from("meta_webhook_events")
            .update({ error_text: message })
            .eq("id", evt.id);
        }
      }
    }
  }

  return {
    processed,
    messagesCreated,
    threadsTouched,
    statusEvents,
    errors,
    reconciledEvents,
    reconciledMessages,
    reconciledThreads,
  };
}

async function handlePayload(
  db: ReturnType<typeof supabaseAdmin>,
  workspaceId: string,
  payload: WaWebhookPayload
) {
  const entries = payload.entry ?? [];
  let messagesCreated = 0;
  let threadsTouched = 0;
  let statusEvents = 0;
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      const value = change.value ?? {};
      const messages = value.messages ?? [];
      const statuses = value.statuses ?? [];
      const phoneNumberId = value.metadata?.phone_number_id ?? null;
      const displayPhone = value.metadata?.display_phone_number ?? phoneNumberId;
      const contactProfile = value.contacts?.[0];
      const contactName = contactProfile?.profile?.name ?? null;
      const contactWaId = contactProfile?.wa_id ?? null;

      // Resolve connection_id from phone_number_id for deterministic routing
      let connectionId: string | null = null;
      if (phoneNumberId) {
        const { connection } = await resolveConnectionForWebhook(phoneNumberId);
        connectionId = connection?.id ?? null;
      }

      if (messages.length > 0) {
        for (const msg of messages) {
          const result = await ingestMessage(
            db,
            workspaceId,
            msg,
            phoneNumberId,
            displayPhone,
            contactWaId ?? msg.from ?? null,
            contactName,
            connectionId
          );
          messagesCreated += result.inserted ? 1 : 0;
          if (result.newThread) threadsTouched += 1;
        }
      }

      if (statuses.length > 0) {
        for (const st of statuses) {
          await updateStatus(db, workspaceId, st);
          statusEvents += 1;
        }
      }
    }
  }
  return { messagesCreated, threadsTouched, statusEvents };
}

async function ingestMessage(
  db: ReturnType<typeof supabaseAdmin>,
  workspaceId: string,
  msg: WaMessage,
  phoneNumberId: string | null,
  displayPhone: string | null,
  contactWaId: string | null,
  contactName: string | null,
  connectionId: string | null
) {
  const contactId = contactWaId ?? msg.from ?? "unknown";
  const threadKey = contactId;
  const textBody =
    msg.text?.body ??
    msg.interactive?.nfm_reply?.response_json?.body ??
    (msg.type ? `[${msg.type}]` : "[message]");
  const preview = textBody.slice(0, 160);

  const phoneId = phoneNumberId ?? "unknown";
  const receivedAt = toDate(msg.timestamp) ?? new Date().toISOString();

  // Upsert thread with connection_id for deterministic outbound routing
  const threadUpsertData: Record<string, unknown> = {
    workspace_id: workspaceId,
    phone_number_id: phoneId,
    contact_wa_id: threadKey,
    contact_name: contactName,
    status: "open",
  };
  // Always set connection_id if available (ensures correct routing)
  if (connectionId) {
    threadUpsertData.connection_id = connectionId;
  }

  const { data: thread, error: threadError } = await db
    .from("wa_threads")
    .upsert(threadUpsertData, { onConflict: "workspace_id,phone_number_id,contact_wa_id" })
    .select("id, unread_count, created_at, updated_at, connection_id")
    .single();

  if (threadError || !thread) {
    throw new Error(threadError?.message ?? "thread_upsert_failed");
  }

  // If thread didn't have connection_id but we have one now, update it
  if (connectionId && !thread.connection_id) {
    await db
      .from("wa_threads")
      .update({ connection_id: connectionId })
      .eq("id", thread.id);
  }

  const newThread = thread.created_at === thread.updated_at;

  const { data: existingMessage, error: existingError } = await db
    .from("wa_messages")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("phone_number_id", phoneId)
    .eq("wa_message_id", msg.id ?? null)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingMessage) {
    return { newThread, inserted: false };
  }

  const mediaId =
    msg.image?.id ?? msg.document?.id ?? msg.audio?.id ?? msg.video?.id ?? null;
  const insertMessage: Record<string, unknown> = {
    workspace_id: workspaceId,
    thread_id: thread.id,
    phone_number_id: phoneId,
    connection_id: connectionId, // FK to wa_phone_numbers for audit
    wa_message_id: msg.id ?? null,
    direction: "inbound",
    type: msg.type ?? "text",
    msg_type: msg.type ?? null,
    status: "received" as const,
    status_at: receivedAt,
    status_updated_at: receivedAt,
    delivered_at: null as string | null,
    read_at: null as string | null,
    failed_at: null as string | null,
    error_code: null as string | null,
    error_message: null as string | null,
    text_body: textBody,
    media_id: mediaId,
    media_url: null as string | null,
    payload_json: msg,
    wa_timestamp: receivedAt,
    sent_at: receivedAt,
    created_at: receivedAt,
    from_wa_id: contactWaId ?? null,
    to_wa_id: displayPhone ?? phoneId,
  };

  const { error: insertError } = await db
    .from("wa_messages")
    .upsert(insertMessage, { onConflict: "workspace_id,phone_number_id,wa_message_id" });

  if (insertError) {
    throw new Error(insertError.message);
  }

  await db
    .from("wa_threads")
    .update({
      last_message_at: receivedAt,
      unread_count: (thread.unread_count ?? 0) + 1,
      last_message_preview: preview,
      updated_at: new Date().toISOString(),
    })
    .eq("id", thread.id);

  // Trigger automation rules for new message
  // Run in background - don't block message processing
  evaluateRulesForThread({
    workspaceId,
    threadId: thread.id,
    triggerType: 'new_message',
    triggerData: { 
      messageId: msg.id,
      contactWaId: contactWaId ?? undefined,
      textBody: textBody.substring(0, 160),
    },
  }).catch((error) => {
    logger.warn('[wa-inbox] Automation rules evaluation failed', {
      threadId: thread.id,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  // AI Auto-Reply is handled exclusively by the AI Reply Worker (scripts/ai-reply-worker.ts)
  // to prevent duplicate replies. Do NOT trigger AI reply from ingestMessage.

  return { newThread, inserted: true };
}

async function updateStatus(
  db: ReturnType<typeof supabaseAdmin>,
  workspaceId: string,
  status: WaStatus
) {
  if (!status.id) return;
  const statusTime = toDate(status.timestamp) ?? new Date().toISOString();
  const normalizedStatus = status.status?.toLowerCase() ?? null;
  const firstError = status.errors?.[0];
  const errorCode = firstError?.code ? String(firstError.code) : null;
  const errorMessage = firstError?.message ?? firstError?.title ?? null;

  // Log to status events table for audit
  const eventPayload = {
    workspace_id: workspaceId,
    external_message_id: status.id,
    status: normalizedStatus,
    payload_json: status,
  };

  try {
    await db.from("wa_message_status_events").insert(eventPayload);
  } catch {
    // ignore duplicates
  }

  // Fetch existing message to check status_updated_at for idempotency
  const { data: existingRow } = await db
    .from("wa_messages")
    .select("id, status, status_updated_at")
    .eq("workspace_id", workspaceId)
    .eq("wa_message_id", status.id)
    .maybeSingle();

  if (!existingRow) {
    // Message not found, nothing to update
    return;
  }

  // Idempotency: only update if incoming timestamp is newer
  const existingUpdatedAt = existingRow.status_updated_at
    ? Date.parse(existingRow.status_updated_at)
    : 0;
  const incomingTs = Date.parse(statusTime);
  if (incomingTs <= existingUpdatedAt) {
    // Skip stale update
    return;
  }

  // Status priority: read > delivered > sent > pending
  const statusPriority: Record<string, number> = {
    pending: 1,
    sent: 2,
    delivered: 3,
    read: 4,
    failed: 5,
  };
  const existingPriority = statusPriority[existingRow.status ?? ""] ?? 0;
  const incomingPriority = statusPriority[normalizedStatus ?? ""] ?? 0;

  // Don't downgrade status (except to failed which can happen anytime)
  if (normalizedStatus !== "failed" && incomingPriority < existingPriority) {
    return;
  }

  const updatePayload: Record<string, unknown> = {
    status: normalizedStatus,
    status_updated_at: statusTime,
  };

  if (normalizedStatus === "sent") {
    updatePayload.status_at = statusTime;
  }
  if (normalizedStatus === "delivered") {
    updatePayload.delivered_at = statusTime;
  }
  if (normalizedStatus === "read") {
    updatePayload.read_at = statusTime;
  }
  if (normalizedStatus === "failed" || normalizedStatus === "undelivered") {
    updatePayload.failed_at = statusTime;
    updatePayload.error_code = errorCode;
    updatePayload.error_message = errorMessage ?? "delivery_failed";
  }

  await db
    .from("wa_messages")
    .update(updatePayload)
    .eq("id", existingRow.id);
}
