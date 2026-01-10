import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

type WaMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
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
        metadata?: { phone_number_id?: string };
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

export async function processWhatsappEvents(workspaceId: string, limit = 25) {
  const db = supabaseAdmin();
  const { data: events, error } = await db
    .from("meta_webhook_events")
    .select("id, payload_json, received_at")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .is("processed_at", null)
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

  for (const evt of events ?? []) {
    const payload = (evt.payload_json || {}) as WaWebhookPayload;
    try {
      const result = await handlePayload(db, workspaceId, payload);
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
          processed_at: new Date().toISOString(),
        })
        .eq("id", evt.id);
    }
  }

  return { processed, messagesCreated, threadsTouched, statusEvents, errors };
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
      const contactProfile = value.contacts?.[0];
      const contactName = contactProfile?.profile?.name ?? null;
      const contactWaId = contactProfile?.wa_id ?? null;

      if (messages.length > 0) {
        for (const msg of messages) {
          const { newThread } = await ingestMessage(
            db,
            workspaceId,
            msg,
            phoneNumberId,
            contactWaId ?? msg.from ?? null,
            contactName
          );
          messagesCreated += 1;
          if (newThread) threadsTouched += 1;
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
  contactWaId: string | null,
  contactName: string | null
) {
  const contactId = contactWaId ?? msg.from ?? "unknown";
  const threadKey = contactId;
  const preview = msg.text?.body
    ? msg.text.body.slice(0, 160)
    : msg.type
    ? `[${msg.type}]`
    : "[message]";

  const { data: thread } = await db
    .from("wa_threads")
    .upsert(
      {
        workspace_id: workspaceId,
        phone_number_id: phoneNumberId ?? "unknown",
        contact_wa_id: threadKey,
        contact_name: contactName,
        last_message_at: toDate(msg.timestamp) ?? new Date().toISOString(),
        unread_count: 1,
        last_message_preview: preview,
      },
      { onConflict: "workspace_id,phone_number_id,contact_wa_id" }
    )
    .select("id, unread_count, inserted_at:created_at, updated_at")
    .single();

  if (!thread) return { newThread: false };
  const newThread = thread.inserted_at === thread.updated_at;

  const receivedAt = toDate(msg.timestamp) ?? new Date().toISOString();
  const insertMessage = {
    workspace_id: workspaceId,
    thread_id: thread.id,
    wa_message_id: msg.id ?? null,
    direction: "in",
    message_type: msg.type ?? null,
    body: msg.text?.body ?? null,
    content_json: msg,
    status: "received",
    received_at: receivedAt,
    created_at: receivedAt,
  };

  try {
    await db
      .from("wa_messages")
      .upsert(insertMessage, { onConflict: "workspace_id,wa_message_id" })
      .select("id")
      .single();
  } catch {
    // ignore duplicates
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

  return { newThread };
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
