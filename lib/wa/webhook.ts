import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchWhatsAppMediaUrl } from "@/lib/wa/cloud";
import { recomputeConversationSla } from "@/lib/inbox/sla";
import { normalizePhone } from "@/lib/contacts/normalize";

const VERIFY_TOKEN =
  process.env.WA_VERIFY_TOKEN || process.env.WA_WEBHOOK_VERIFY_TOKEN || "";

function normalizeStatus(status?: string) {
  if (status === "sent") return "sent";
  if (status === "delivered") return "delivered";
  if (status === "read") return "read";
  if (status === "failed") return "failed";
  return null;
}

type WaErrorInfo = { title?: string; message?: string };
type WaStatus = { id?: string; status?: string; errors?: WaErrorInfo[] };
type WaContact = { wa_id?: string; profile?: { name?: string } };
type WaMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string; mime_type?: string; sha256?: string; caption?: string };
  document?: { id?: string; mime_type?: string; sha256?: string; caption?: string; filename?: string };
  video?: { id?: string; mime_type?: string; sha256?: string; caption?: string };
  audio?: { id?: string; mime_type?: string; sha256?: string };
};
type WaChangeValue = {
  statuses?: WaStatus[];
  messages?: WaMessage[];
  contacts?: WaContact[];
};
type WaEntry = { changes?: Array<{ value?: WaChangeValue }> };
export type WaWebhookPayload = { entry?: WaEntry[] };

async function resolveMediaUrl(mediaId?: string) {
  if (!mediaId) return { url: null, error: null };
  try {
    const res = await fetchWhatsAppMediaUrl(mediaId);
    const url = (res.data as { url?: string })?.url || null;
    return { url, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "media_lookup_failed";
    return { url: `wa-media://${mediaId}`, error: message };
  }
}

export function handleWhatsAppVerify(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && challenge) {
    if (token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  return new Response("OK", { status: 200 });
}

type DbQuery = {
  select: (columns: string) => DbQuery;
  eq: (column: string, value: unknown) => DbQuery;
  update: (values: Record<string, unknown>) => DbQuery;
  insert: (values: Record<string, unknown>) => DbQuery;
};

type DbClient = {
  from: (table: string) => DbQuery;
};

type DbResult<T> = { data: T | null; error: { message: string } | null };

export async function processWhatsAppPayload(params: {
  db: unknown;
  workspaceId?: string | null;
  payload: WaWebhookPayload;
}) {
  const { db, payload, workspaceId } = params;
  const client = db as DbClient;
  const entries = payload?.entry ?? [];

  for (const entry of entries) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value ?? {};
      const statuses = value?.statuses ?? [];
      const inboundMessages = value?.messages ?? [];
      const inboundContacts = value?.contacts ?? [];

      for (const status of statuses) {
        const waId = status?.id;
        const mapped = normalizeStatus(status?.status);
        if (!waId || !mapped) continue;

        const errorReason =
          status?.errors?.[0]?.title || status?.errors?.[0]?.message || null;

        const updatedRes = (await (client
          .from("messages")
          .update({
            status: mapped,
            error_reason: mapped === "failed" ? errorReason : null,
          })
          .eq("wa_message_id", waId)
          .select("id, conversation_id") as unknown as Promise<
          DbResult<{ id?: string | null; conversation_id?: string | null }>
        >)) as DbResult<{ id?: string | null; conversation_id?: string | null }>;

        if (!updatedRes.error && updatedRes.data?.id) {
          const eventRes = (await (client
            .from("message_events")
            .insert({
              message_id: updatedRes.data.id,
              event_type: `status.${mapped}`,
              payload: status ?? {},
            }) as unknown as Promise<DbResult<unknown>>)) as DbResult<unknown>;
          if (eventRes.error) {
            console.log("message_events insert failed (status)", eventRes.error.message);
          }
        }
      }

      if (!workspaceId || inboundMessages.length === 0) continue;

      for (const msg of inboundMessages) {
        try {
          const waMessageId = msg?.id;
          const from = msg?.from;
          if (!waMessageId || !from) continue;

          const existingRes = (await (client
            .from("messages")
            .select("id")
            .eq("wa_message_id", waMessageId) as unknown as Promise<DbResult<{ id?: string }>>)) as DbResult<{
            id?: string;
          }>;
          if (existingRes.data?.id) continue;

          const contactProfile = inboundContacts.find((c) => c?.wa_id === from);
          const contactName = contactProfile?.profile?.name || from;

          let mediaId: string | undefined;
          let mediaMime: string | undefined;
          let mediaSha: string | undefined;
          let textBody: string | undefined;

          if (msg?.type === "text") {
            textBody = msg?.text?.body || "";
          } else if (msg?.type === "image") {
            mediaId = msg?.image?.id;
            mediaMime = msg?.image?.mime_type;
            mediaSha = msg?.image?.sha256;
            textBody = msg?.image?.caption || "[image]";
          } else if (msg?.type === "document") {
            mediaId = msg?.document?.id;
            mediaMime = msg?.document?.mime_type;
            mediaSha = msg?.document?.sha256;
            textBody = msg?.document?.caption || msg?.document?.filename || "[document]";
          } else if (msg?.type === "video") {
            mediaId = msg?.video?.id;
            mediaMime = msg?.video?.mime_type;
            mediaSha = msg?.video?.sha256;
            textBody = msg?.video?.caption || "[video]";
          } else if (msg?.type === "audio") {
            mediaId = msg?.audio?.id;
            mediaMime = msg?.audio?.mime_type;
            mediaSha = msg?.audio?.sha256;
            textBody = "[audio]";
          } else {
            textBody = `[${msg?.type || "message"}]`;
          }

          const contactRes = (await (client
            .from("contacts")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("phone", from) as unknown as Promise<DbResult<{ id?: string }>>)) as DbResult<{
            id?: string;
          }>;

          let contactId = contactRes.data?.id;
          if (!contactId) {
            const insertedRes = (await (client
              .from("contacts")
              .insert({
                workspace_id: workspaceId,
                name: contactName,
                phone: from,
                phone_norm: normalizePhone(from),
                last_seen_at: new Date().toISOString(),
              })
              .select("id") as unknown as Promise<DbResult<{ id?: string }>>)) as DbResult<{
              id?: string;
            }>;
            contactId = insertedRes.data?.id;
          }

          if (!contactId) continue;

          const convRes = (await (client
            .from("conversations")
            .select("id, unread_count")
            .eq("workspace_id", workspaceId)
            .eq("contact_id", contactId) as unknown as Promise<
            DbResult<{ id?: string; unread_count?: number | null }>
          >)) as DbResult<{ id?: string; unread_count?: number | null }>;

          let conversationId = convRes.data?.id;
          let unreadCount = convRes.data?.unread_count ?? 0;

          if (!conversationId) {
            const insertedConvRes = (await (client
              .from("conversations")
              .insert({
                workspace_id: workspaceId,
                contact_id: contactId,
                ticket_status: "open",
                priority: "low",
                unread_count: 0,
              })
              .select("id") as unknown as Promise<DbResult<{ id?: string }>>)) as DbResult<{
              id?: string;
            }>;
            conversationId = insertedConvRes.data?.id;
            unreadCount = 0;
          }

          if (!conversationId) continue;

          const ts = msg?.timestamp
            ? new Date(Number(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          const { url: mediaUrl } = await resolveMediaUrl(mediaId);

          const insertedMessageRes = (await (client
            .from("messages")
            .insert({
              workspace_id: workspaceId,
              conversation_id: conversationId,
              direction: "in",
              text: textBody || "",
              ts,
              status: null,
              wa_message_id: waMessageId,
              media_url: mediaUrl,
              media_mime: mediaMime ?? null,
              media_sha256: mediaSha ?? null,
            })
            .select("id") as unknown as Promise<DbResult<{ id?: string }>>)) as DbResult<{
            id?: string;
          }>;

          await client
            .from("conversations")
            .update({
              last_message_at: ts,
              last_customer_message_at: ts,
              unread_count: unreadCount + 1,
            })
            .eq("workspace_id", workspaceId)
            .eq("id", conversationId);

          await client
            .from("contacts")
            .update({ last_seen_at: ts, phone_norm: normalizePhone(from) })
            .eq("workspace_id", workspaceId)
            .eq("id", contactId);

          if (insertedMessageRes.data?.id) {
            const inboundRes = (await (client
              .from("message_events")
              .insert({
                message_id: insertedMessageRes.data.id,
                event_type: "inbound.message",
                payload: msg ?? {},
              }) as unknown as Promise<DbResult<unknown>>)) as DbResult<unknown>;
            if (inboundRes.error) {
              console.log("message_events insert failed (inbound)", inboundRes.error.message);
            }
          }

          await recomputeConversationSla({
            db,
            workspaceId,
            conversationId,
            overrides: {
              lastCustomerMessageAt: ts,
              ticketStatus: "open",
            },
          });
        } catch (err: unknown) {
          console.log("WEBHOOK_INBOUND_ERROR", err);
        }
      }
    }
  }
}

export async function handleWhatsAppWebhook(req: Request) {
  const body = (await req.json().catch(() => null)) as WaWebhookPayload | null;
  if (!body) return new Response("OK", { status: 200 });

  const db = supabaseAdmin();
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;
  await processWhatsAppPayload({ db, workspaceId, payload: body });

  return new Response("OK", { status: 200 });
}
