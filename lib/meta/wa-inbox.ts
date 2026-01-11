import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

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

      if (messages.length > 0) {
        for (const msg of messages) {
          const result = await ingestMessage(
            db,
            workspaceId,
            msg,
            phoneNumberId,
            displayPhone,
            contactWaId ?? msg.from ?? null,
            contactName
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
  contactName: string | null
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

  const { data: thread, error: threadError } = await db
    .from("wa_threads")
    .upsert(
      {
        workspace_id: workspaceId,
        phone_number_id: phoneId,
        contact_wa_id: threadKey,
        contact_name: contactName,
        status: "open",
      },
      { onConflict: "workspace_id,phone_number_id,contact_wa_id" }
    )
    .select("id, unread_count, created_at, updated_at")
    .single();

  if (threadError || !thread) {
    throw new Error(threadError?.message ?? "thread_upsert_failed");
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
  const insertMessage = {
    workspace_id: workspaceId,
    thread_id: thread.id,
    phone_number_id: phoneId,
    wa_message_id: msg.id ?? null,
    direction: "inbound",
    type: msg.type ?? "text",
    msg_type: msg.type ?? null,
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

  return { newThread, inserted: true };
}

async function updateStatus(
  db: ReturnType<typeof supabaseAdmin>,
  workspaceId: string,
  status: WaStatus
) {
  if (!status.id) return;
  const payload = {
    workspace_id: workspaceId,
    external_message_id: status.id,
    status: status.status ?? null,
    payload_json: status,
  };

  try {
    await db.from("wa_message_status_events").insert(payload);
  } catch {
    // ignore duplicates
  }

  await db
    .from("wa_messages")
    .update({ status: status.status ?? null })
    .eq("workspace_id", workspaceId)
    .eq("wa_message_id", status.id);
}
