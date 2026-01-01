// app/api/webhooks/whatsapp/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

// Local test helper:
// GET verify:
//   curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=12345"
// POST sample:
//   curl -X POST http://localhost:3000/api/webhooks/whatsapp ^
//     -H "Content-Type: application/json" ^
//     -d "{\"object\":\"whatsapp_business_account\",\"entry\":[{\"changes\":[{\"value\":{\"messages\":[{\"id\":\"wamid.HBgLM\",\"from\":\"6281234567890\",\"timestamp\":\"1700000000\",\"type\":\"text\",\"text\":{\"body\":\"hello\"}}],\"contacts\":[{\"wa_id\":\"6281234567890\",\"profile\":{\"name\":\"Test User\"}}]}}]}]}"

const VERIFY_TOKEN =
  process.env.WA_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || "";
const APP_SECRET = process.env.WA_APP_SECRET || "";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

type WaErrorInfo = { title?: string; message?: string };
type WaStatus = { id?: string; status?: string; errors?: WaErrorInfo[] };
type WaContact = { wa_id?: string; profile?: { name?: string } };
type WaMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
};
type WaChangeValue = {
  statuses?: WaStatus[];
  messages?: WaMessage[];
  contacts?: WaContact[];
};
type WaEntry = { changes?: Array<{ value?: WaChangeValue }> };
type WaWebhookPayload = { object?: string; entry?: WaEntry[] };

type MessageRow = { id: string; conversation_id: string };
type ContactRow = { id: string; name: string | null };
type ConversationRow = { id: string; unread_count: number | null };

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

type DbTable<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: never[];
};

type Database = {
  public: {
    Tables: {
      contacts: DbTable<{
        id: string;
        workspace_id: string;
        name: string | null;
        phone: string;
        tags: string[] | null;
        last_seen_at: string | null;
      }>;
      conversations: DbTable<{
        id: string;
        workspace_id: string;
        contact_id: string;
        assigned_to: string | null;
        ticket_status: string | null;
        priority: string | null;
        unread_count: number | null;
        last_message_at: string | null;
        is_archived: boolean | null;
        pinned: boolean | null;
        snoozed_until: string | null;
        last_read_at: string | null;
      }>;
      messages: DbTable<{
        id: string;
        workspace_id: string;
        conversation_id: string;
        direction: string;
        text: string;
        ts: string;
        status: string | null;
        wa_message_id: string | null;
        error_reason: string | null;
      }>;
      message_events: DbTable<{
        id: string;
        message_id: string | null;
        event_type: string;
        payload: Json;
        ts: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseAdminClient = ReturnType<typeof createClient<Database>>;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      "WA_WEBHOOK_ENV_MISSING",
      JSON.stringify({
        hasUrl: Boolean(SUPABASE_URL),
        hasServiceKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      })
    );
    return null;
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function toIsoFromTimestamp(ts: string | number | undefined) {
  if (ts === undefined || ts === null) return new Date().toISOString();
  const num = Number(ts);
  if (!Number.isFinite(num)) return new Date().toISOString();
  return new Date(num * 1000).toISOString();
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "***";
  return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
}

function logWebhookSummary(body: WaWebhookPayload | null) {
  if (!body) {
    console.log("WA_WEBHOOK_IN", JSON.stringify({ ok: false, reason: "invalid_json" }));
    return;
  }

  const entries = safeArray(body.entry);
  const meta = {
    object: body.object ?? null,
    entryCount: entries.length,
    changeCount: 0,
    messageCount: 0,
    statusCount: 0,
    messageIds: [] as string[],
    from: [] as string[],
  };

  for (const entry of entries) {
    const changes = safeArray(entry.changes);
    meta.changeCount += changes.length;
    for (const change of changes) {
      const value = change?.value ?? {};
      const messages = safeArray(value.messages);
      const statuses = safeArray(value.statuses);
      meta.messageCount += messages.length;
      meta.statusCount += statuses.length;
      for (const msg of messages) {
        if (msg?.id) meta.messageIds.push(msg.id);
        if (msg?.from) meta.from.push(maskPhone(msg.from));
      }
    }
  }

  console.log("WA_WEBHOOK_IN", JSON.stringify(meta));
}

function isValidSignature(rawBody: string, signatureHeader: string, secret: string) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const signature = signatureHeader.replace("sha256=", "");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function mapStatus(status?: string) {
  if (status === "sent") return "sent";
  if (status === "delivered") return "delivered";
  if (status === "read") return "read";
  if (status === "failed") return "failed";
  return null;
}

function asJson(value: unknown): Json {
  return value as Json;
}

async function upsertContact(params: {
  db: SupabaseAdminClient;
  workspaceId: string;
  phone: string;
  name: string | null;
  lastSeenAt: string;
}) {
  const { db, workspaceId, phone, name, lastSeenAt } = params;
  const { data: existing, error } = await db
    .from("contacts")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.log("WA_WEBHOOK_CONTACT_SELECT_ERROR", error.message);
    return null;
  }

  const contact = existing as ContactRow | null;
  if (contact?.id) {
    const update: { last_seen_at: string; name?: string } = { last_seen_at: lastSeenAt };
    if (!contact.name && name) update.name = name;
    const { error: updErr } = await db
      .from("contacts")
      .update(update)
      .eq("workspace_id", workspaceId)
      .eq("id", contact.id);
    if (updErr) {
      console.log("WA_WEBHOOK_CONTACT_UPDATE_ERROR", updErr.message);
    }
    return contact.id;
  }

  const { data: inserted, error: insErr } = await db
    .from("contacts")
    .insert({
      workspace_id: workspaceId,
      phone,
      name,
      tags: [],
      last_seen_at: lastSeenAt,
    })
    .select("id")
    .single();

  if (insErr) {
    console.log("WA_WEBHOOK_CONTACT_INSERT_ERROR", insErr.message);
    return null;
  }
  return (inserted as ContactRow | null)?.id ?? null;
}

async function ensureConversation(params: {
  db: SupabaseAdminClient;
  workspaceId: string;
  contactId: string;
}) {
  const { db, workspaceId, contactId } = params;
  const { data: existing, error } = await db
    .from("conversations")
    .select("id, unread_count")
    .eq("workspace_id", workspaceId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (error) {
    console.log("WA_WEBHOOK_CONV_SELECT_ERROR", error.message);
    return { id: null, unreadCount: 0 };
  }

  const convo = existing as ConversationRow | null;
  if (convo?.id) {
    return { id: convo.id, unreadCount: convo.unread_count ?? 0 };
  }

  const { data: inserted, error: insErr } = await db
    .from("conversations")
    .insert({
      workspace_id: workspaceId,
      contact_id: contactId,
      ticket_status: "open",
      priority: "low",
      unread_count: 0,
    })
    .select("id")
    .single();

  if (insErr) {
    console.log("WA_WEBHOOK_CONV_INSERT_ERROR", insErr.message);
    return { id: null, unreadCount: 0 };
  }

  return { id: (inserted as ConversationRow | null)?.id ?? null, unreadCount: 0 };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && !VERIFY_TOKEN) {
    console.log("WA_WEBHOOK_ENV_MISSING", JSON.stringify({ missing: "WA_WEBHOOK_VERIFY_TOKEN" }));
  }

  if (mode === "subscribe" && token && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";

  if (APP_SECRET) {
    const ok = isValidSignature(rawBody, signature, APP_SECRET);
    if (!ok) {
      console.log("WA_WEBHOOK_SIGNATURE_INVALID");
      return new Response("Forbidden", { status: 403 });
    }
  } else if (signature) {
    console.log("WA_WEBHOOK_SIGNATURE_SKIPPED");
  }

  let body: WaWebhookPayload | null = null;
  try {
    body = rawBody ? (JSON.parse(rawBody) as WaWebhookPayload) : null;
  } catch {
    body = null;
  }

  logWebhookSummary(body);

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true });

  const { error: rawErr } = await db.from("message_events").insert({
    event_type: "wa_webhook",
    payload: asJson(body ?? {}),
  });
  if (rawErr) {
    console.log("WA_WEBHOOK_EVENT_INSERT_ERROR", rawErr.message);
  }

  const workspaceId = process.env.DEFAULT_WORKSPACE_ID || "";
  if (!workspaceId) {
    console.log("WA_WEBHOOK_ENV_MISSING", JSON.stringify({ missing: "DEFAULT_WORKSPACE_ID" }));
    return NextResponse.json({ ok: true });
  }

  const entries = safeArray(body?.entry);
  for (const entry of entries) {
    const changes = safeArray(entry?.changes);
    for (const change of changes) {
      const value = change?.value ?? {};
      const messages = safeArray(value?.messages);
      const contacts = safeArray(value?.contacts);
      const statuses = safeArray(value?.statuses);

      for (const status of statuses) {
        const waId = status?.id;
        const mapped = mapStatus(status?.status);
        if (!waId || !mapped) continue;

        const errorReason =
          status?.errors?.[0]?.title || status?.errors?.[0]?.message || null;

        const { data: updated, error } = await db
          .from("messages")
          .update({
            status: mapped,
            error_reason: mapped === "failed" ? errorReason : null,
          })
          .eq("wa_message_id", waId)
          .select("id, conversation_id")
          .maybeSingle();

        if (!error && (updated as MessageRow | null)?.id) {
          const { error: eventErr } = await db
            .from("message_events")
            .insert({
              message_id: (updated as MessageRow).id,
              event_type: `status.${mapped}`,
              payload: asJson(status ?? {}),
            });
          if (eventErr) {
            console.log("WA_WEBHOOK_EVENT_INSERT_ERROR", eventErr.message);
          }
        }
      }

      for (const msg of messages) {
        try {
          if (msg?.type !== "text") continue;
          const waMessageId = msg?.id;
          const from = msg?.from;
          const textBody = msg?.text?.body ?? "";
          if (!waMessageId || !from) continue;

          const { data: existing } = await db
            .from("messages")
            .select("id")
            .eq("wa_message_id", waMessageId)
            .maybeSingle();
          if ((existing as MessageRow | null)?.id) continue;

          const profile = contacts.find((c) => c?.wa_id === from);
          const name = profile?.profile?.name || null;
          const ts = toIsoFromTimestamp(msg?.timestamp);

          const contactId = await upsertContact({
            db,
            workspaceId,
            phone: from,
            name,
            lastSeenAt: ts,
          });
          if (!contactId) continue;

          const { id: conversationId, unreadCount } = await ensureConversation({
            db,
            workspaceId,
            contactId,
          });
          if (!conversationId) continue;

          const { data: inserted, error: msgErr } = await db
            .from("messages")
            .insert({
              workspace_id: workspaceId,
              conversation_id: conversationId,
              direction: "in",
              text: textBody,
              status: "delivered",
              ts,
              wa_message_id: waMessageId,
            })
            .select("id")
            .single();

          if (msgErr) {
            console.log("WA_WEBHOOK_MESSAGE_INSERT_ERROR", msgErr.message);
            continue;
          }

          const nextUnread = (unreadCount ?? 0) + 1;
          const updates = [
            db
              .from("conversations")
              .update({ last_message_at: ts, unread_count: nextUnread })
              .eq("workspace_id", workspaceId)
              .eq("id", conversationId),
            db
              .from("contacts")
              .update({ last_seen_at: ts })
              .eq("workspace_id", workspaceId)
              .eq("id", contactId),
          ];

          const settled = await Promise.allSettled(updates);
          settled.forEach((res) => {
            if (res.status === "fulfilled" && res.value.error) {
              console.log("WA_WEBHOOK_UPDATE_ERROR", res.value.error.message);
            }
          });

          if ((inserted as MessageRow | null)?.id) {
            const { error: eventErr } = await db.from("message_events").insert({
              message_id: (inserted as MessageRow).id,
              event_type: "inbound.message",
              payload: asJson(msg ?? {}),
            });
            if (eventErr) {
              console.log("WA_WEBHOOK_EVENT_INSERT_ERROR", eventErr.message);
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.log("WA_WEBHOOK_PARSE_ERROR", message);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
