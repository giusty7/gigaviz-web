import { fetchWhatsAppMediaUrl } from "@/lib/wa/cloud";
import { recomputeConversationSla } from "@/lib/inbox/sla";
import { maybeAutoRouteInbound } from "@/lib/inbox/routing";
import { normalizePhone } from "@/lib/contacts/normalize";

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
type WaMetadata = { phone_number_id?: string };
type WaChangeValue = {
  statuses?: WaStatus[];
  messages?: WaMessage[];
  contacts?: WaContact[];
  metadata?: WaMetadata;
};
type WaEntry = { id?: string; changes?: Array<{ value?: WaChangeValue }> };

export type WaWebhookPayload = { entry?: WaEntry[] };
export type WaProcessResult = { processedMessages: number; errors: string[] };

type DbResult<T> = { data: T | null; error: { message: string } | null };

// Minimal supabase-like chain typing (biar TS tenang)
type DbQuery = {
  select: (columns: string) => DbQuery;
  eq: (column: string, value: unknown) => DbQuery;
  is: (column: string, value: unknown) => DbQuery;
  update: (values: Record<string, unknown>) => DbQuery;
  insert: (values: Record<string, unknown>) => DbQuery;
  upsert: (values: Record<string, unknown>, opts?: { onConflict?: string }) => DbQuery;
  maybeSingle: () => Promise<DbResult<unknown>>;
};

type DbClient = { from: (table: string) => DbQuery };

function toErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "unknown_error";
}

async function resolveMediaUrl(mediaId?: string) {
  if (!mediaId) return { url: null as string | null, error: null as string | null };
  try {
    const res = await fetchWhatsAppMediaUrl(mediaId);
    const url = (res.data as { url?: string })?.url || null;
    return { url, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "media_lookup_failed";
    return { url: `wa-media://${mediaId}`, error: message };
  }
}

function safePhoneNorm(raw: string) {
  // normalizePhone kadang balik undefined → kita paksa jadi string (bukan undefined)
  const n = normalizePhone(raw);
  if (typeof n === "string" && n.length > 0) return n;
  const digits = raw.replace(/\D/g, "");
  return digits.length > 0 ? digits : raw;
}

export async function processWhatsAppPayload(params: {
  db: unknown;
  workspaceId?: string | null; // fallback
  payload: WaWebhookPayload;
}): Promise<WaProcessResult> {
  const { db, payload, workspaceId } = params;
  const client = db as DbClient;

  const entries = payload?.entry ?? [];
  const errors: string[] = [];
  let processedMessages = 0;

  const workspaceCache = new Map<string, string | null>();

  const resolveWorkspaceId = async (phoneNumberId?: string | null, wabaId?: string | null) => {
    const pn = phoneNumberId ? String(phoneNumberId) : "";
    const waba = wabaId ? String(wabaId) : "";

    if (!pn && !waba) return workspaceId ?? null;

    const pnKey = pn ? `pn:${pn}` : "";
    const wabaKey = waba ? `waba:${waba}` : "";

    if (pnKey && workspaceCache.has(pnKey)) return workspaceCache.get(pnKey) ?? null;
    if (wabaKey && workspaceCache.has(wabaKey)) return workspaceCache.get(wabaKey) ?? null;

    // 1) try phone_number_id
    if (pn) {
      const res = (await client
        .from("workspaces")
        .select("id")
        .eq("wa_phone_number_id", pn)
        .maybeSingle()) as DbResult<{ id?: string | null }>;
      if (res.error) errors.push("workspace_lookup_failed");
      if (res.data?.id) {
        workspaceCache.set(pnKey, res.data.id);
        return res.data.id;
      }
    }

    // 2) fallback waba_id
    if (waba) {
      const res = (await client
        .from("workspaces")
        .select("id")
        .eq("wa_waba_id", waba)
        .maybeSingle()) as DbResult<{ id?: string | null }>;
      if (res.error) errors.push("workspace_lookup_failed");
      if (res.data?.id) {
        workspaceCache.set(wabaKey, res.data.id);
        return res.data.id;
      }
    }

    errors.push("workspace_not_found");
    const fallback = workspaceId ?? null;

    if (pnKey) workspaceCache.set(pnKey, fallback);
    if (wabaKey) workspaceCache.set(wabaKey, fallback);

    if (!fallback) console.log("WA_WORKSPACE_NOT_FOUND", JSON.stringify({ phoneNumberId, wabaId }));
    else console.log("WA_WORKSPACE_FALLBACK_USED", JSON.stringify({ phoneNumberId, wabaId, fallback }));

    return fallback;
  };

  for (const entry of entries) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value ?? {};
      const statuses = value?.statuses ?? [];
      const inboundMessages = value?.messages ?? [];
      const inboundContacts = value?.contacts ?? [];
      const phoneNumberId = value?.metadata?.phone_number_id ?? null;
      const wabaId = entry?.id ?? null;

      // ---- statuses (outbound delivery receipts)
      for (const s of statuses) {
        const waId = s?.id;
        const mapped = normalizeStatus(s?.status);
        if (!waId || !mapped) continue;

        const errorReason = s?.errors?.[0]?.title || s?.errors?.[0]?.message || null;

        const updatedRes = (await client
          .from("messages")
          .update({
            status: mapped,
            error_reason: mapped === "failed" ? errorReason : null,
          })
          .eq("wa_message_id", waId)
          .select("id, conversation_id")
          .maybeSingle()) as DbResult<{ id?: string | null; conversation_id?: string | null }>;

        if (updatedRes.error) {
          console.log("WA_STATUS_UPDATE_FAILED", updatedRes.error.message);
          errors.push("status_update_failed");
          continue;
        }

        if (updatedRes.data?.id) {
          const ev = (await client
            .from("message_events")
            .insert({
              message_id: updatedRes.data.id,
              event_type: `status.${mapped}`,
              payload: s ?? {},
            })
            .maybeSingle()) as DbResult<unknown>;

          if (ev.error) {
            console.log("WA_STATUS_EVENT_INSERT_FAILED", ev.error.message);
            errors.push("status_event_insert_failed");
          }
        }
      }

      // ---- inbound messages
      if (inboundMessages.length === 0) continue;

      const resolvedWorkspaceId = await resolveWorkspaceId(phoneNumberId, wabaId);
      if (!resolvedWorkspaceId) continue;

      for (const msg of inboundMessages) {
        try {
          const waMessageId = msg?.id;
          const fromRaw = msg?.from;
          if (!waMessageId || !fromRaw) continue;

          // idempotency (cek existing message)
          const existingRes = (await client
            .from("messages")
            .select("id")
            .eq("workspace_id", resolvedWorkspaceId)
            .eq("wa_message_id", waMessageId)
            .maybeSingle()) as DbResult<{ id?: string | null }>;

          if (existingRes.error) {
            console.log("WA_MESSAGE_LOOKUP_FAILED", existingRes.error.message);
            errors.push("message_lookup_failed");
            continue;
          }
          if (existingRes.data?.id) continue;

          const ts = msg?.timestamp
            ? new Date(Number(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          const phoneNorm = safePhoneNorm(fromRaw);

          const contactProfile = inboundContacts.find((c) => c?.wa_id === fromRaw);
          const contactName = contactProfile?.profile?.name || fromRaw;

          // parse body + media
          let mediaId: string | undefined;
          let mediaMime: string | undefined;
          let mediaSha: string | undefined;
          let textBody: string;

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

          // ---- CONTACT: lookup by phone_norm first (skip deleted/merged)
          let contactId: string | null = null;

          const contactByNorm = (await client
            .from("contacts")
            .select("id")
            .eq("workspace_id", resolvedWorkspaceId)
            .eq("phone_norm", phoneNorm)
            .is("deleted_at", null)
            .is("merged_into_contact_id", null)
            .maybeSingle()) as DbResult<{ id?: string | null }>;

          if (contactByNorm.error) {
            console.log("WA_CONTACT_LOOKUP_FAILED", contactByNorm.error.message);
            errors.push("contact_lookup_failed");
          }

          contactId = contactByNorm.data?.id ?? null;

          if (!contactId) {
            // upsert supaya aman dari race-condition
            const upserted = (await client
              .from("contacts")
              .upsert(
                {
                  workspace_id: resolvedWorkspaceId,
                  name: contactName,
                  phone: fromRaw,
                  phone_norm: phoneNorm,
                  tags: [],
                  comms_status: "normal",
                  comms_status_updated_at: ts,
                  last_seen_at: ts,
                  created_at: ts,
                },
                { onConflict: "workspace_id,phone_norm" }
              )
              .select("id")
              .maybeSingle()) as DbResult<{ id?: string | null }>;

            if (upserted.error) {
              console.log("WA_CONTACT_UPSERT_FAILED", upserted.error.message);
              errors.push("contact_insert_failed");
            }

            contactId = upserted.data?.id ?? null;
          }

          if (!contactId) continue;

          // ---- CONVERSATION: 1 contact = 1 thread (aktif)
          const convRes = (await client
            .from("conversations")
            .select("id, unread_count")
            .eq("workspace_id", resolvedWorkspaceId)
            .eq("contact_id", contactId)
            .maybeSingle()) as DbResult<{ id?: string | null; unread_count?: number | null }>;

          if (convRes.error) {
            console.log("WA_CONVERSATION_LOOKUP_FAILED", convRes.error.message);
            errors.push("conversation_lookup_failed");
          }

          let conversationId = convRes.data?.id ?? null;
          let unreadCount = convRes.data?.unread_count ?? 0;

          if (!conversationId) {
            const insertedConv = (await client
              .from("conversations")
              .insert({
                workspace_id: resolvedWorkspaceId,
                contact_id: contactId,
                ticket_status: "open",
                priority: "low",
                unread_count: 0,
                is_archived: false,
                pinned: false,
                last_message_at: ts,
                last_customer_message_at: ts,
              })
              .select("id")
              .maybeSingle()) as DbResult<{ id?: string | null }>;

            if (insertedConv.error) {
              console.log("WA_CONVERSATION_INSERT_FAILED", insertedConv.error.message);
              errors.push("conversation_insert_failed");
            }

            conversationId = insertedConv.data?.id ?? null;
            unreadCount = 0;
          }

          if (!conversationId) continue;

          const { url: mediaUrl } = await resolveMediaUrl(mediaId);

          // ---- MESSAGE insert
          const insertedMessage = (await client
            .from("messages")
            .insert({
              workspace_id: resolvedWorkspaceId,
              conversation_id: conversationId,
              direction: "in",
              text: textBody,
              ts,
              status: null,
              wa_message_id: waMessageId,
              media_url: mediaUrl,
              media_mime: mediaMime ?? null,
              media_sha256: mediaSha ?? null,
            })
            .select("id")
            .maybeSingle()) as DbResult<{ id?: string | null }>;

          if (insertedMessage.error) {
            console.log("WA_MESSAGE_INSERT_FAILED", insertedMessage.error.message);
            errors.push("message_insert_failed");
            continue;
          }

          // update convo + contact
          await client
            .from("conversations")
            .update({
              last_message_at: ts,
              last_customer_message_at: ts,
              unread_count: unreadCount + 1,
              ticket_status: "open",
            })
            .eq("workspace_id", resolvedWorkspaceId)
            .eq("id", conversationId);

          await client
            .from("contacts")
            .update({
              last_seen_at: ts,
              phone: fromRaw,
              phone_norm: phoneNorm,
            })
            .eq("workspace_id", resolvedWorkspaceId)
            .eq("id", contactId);

          // event log inbound
          if (insertedMessage.data?.id) {
            await client
              .from("message_events")
              .insert({
                message_id: insertedMessage.data.id,
                event_type: "inbound.message",
                payload: msg ?? {},
              })
              .maybeSingle();
          }

          await recomputeConversationSla({
            db,
            workspaceId: resolvedWorkspaceId,
            conversationId,
            overrides: { lastCustomerMessageAt: ts, ticketStatus: "open" },
          });

          await maybeAutoRouteInbound({
            db,
            workspaceId: resolvedWorkspaceId,
            conversationId,
            text: textBody,
          });

          processedMessages += 1;
        } catch (err: unknown) {
          console.log("WEBHOOK_INBOUND_ERROR", err);
          errors.push(toErrorMessage(err));
        }
      }
    }
  }

  return { processedMessages, errors };
}
