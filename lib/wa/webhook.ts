import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchWhatsAppMediaUrl } from "@/lib/wa/cloud";

const VERIFY_TOKEN =
  process.env.WA_VERIFY_TOKEN || process.env.WA_WEBHOOK_VERIFY_TOKEN || "";

function normalizeStatus(status: string) {
  if (status === "sent") return "sent";
  if (status === "delivered") return "delivered";
  if (status === "read") return "read";
  if (status === "failed") return "failed";
  return null;
}

async function resolveMediaUrl(mediaId?: string) {
  if (!mediaId) return { url: null, error: null };
  try {
    const res = await fetchWhatsAppMediaUrl(mediaId);
    const url = (res.data as any)?.url || null;
    return { url, error: null };
  } catch (err: any) {
    return { url: `wa-media://${mediaId}`, error: err?.message || "media_lookup_failed" };
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

export async function handleWhatsAppWebhook(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response("OK", { status: 200 });

  const db = supabaseAdmin();
  const entries = body?.entry ?? [];
  const workspaceId = process.env.DEFAULT_WORKSPACE_ID;

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

        const { data: updated, error } = await db
          .from("messages")
          .update({
            status: mapped,
            error_reason: mapped === "failed" ? errorReason : null,
          })
          .eq("wa_message_id", waId)
          .select("id, conversation_id")
          .maybeSingle();

        if (!error && updated?.id) {
          const { error: eventErr } = await db
            .from("message_events")
            .insert({
              message_id: updated.id,
              event_type: `status.${mapped}`,
              payload: status ?? {},
            });
          if (eventErr) {
            console.log("message_events insert failed (status)", eventErr.message);
          }
        }
      }

      if (!workspaceId || inboundMessages.length === 0) continue;

      for (const msg of inboundMessages) {
        try {
          const waMessageId = msg?.id;
          const from = msg?.from;
          if (!waMessageId || !from) continue;

          const { data: existing } = await db
            .from("messages")
            .select("id")
            .eq("wa_message_id", waMessageId)
            .maybeSingle();
          if (existing?.id) continue;

          const contactProfile = inboundContacts.find((c: any) => c?.wa_id === from);
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

          const { data: contact } = await db
            .from("contacts")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("phone", from)
            .maybeSingle();

          let contactId = contact?.id;
          if (!contactId) {
            const { data: insertedContact } = await db
              .from("contacts")
              .insert({
                workspace_id: workspaceId,
                name: contactName,
                phone: from,
                last_seen_at: new Date().toISOString(),
              })
              .select("id")
              .single();
            contactId = insertedContact?.id;
          }

          if (!contactId) continue;

          const { data: conv } = await db
            .from("conversations")
            .select("id, unread_count")
            .eq("workspace_id", workspaceId)
            .eq("contact_id", contactId)
            .maybeSingle();

          let conversationId = conv?.id;
          let unreadCount = conv?.unread_count ?? 0;

          if (!conversationId) {
            const { data: insertedConv } = await db
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
            conversationId = insertedConv?.id;
            unreadCount = 0;
          }

          if (!conversationId) continue;

          const ts = msg?.timestamp
            ? new Date(Number(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          const { url: mediaUrl } = await resolveMediaUrl(mediaId);

          const { data: insertedMessage } = await db
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
            .select("id")
            .single();

          await db
            .from("conversations")
            .update({
              last_message_at: ts,
              unread_count: unreadCount + 1,
            })
            .eq("workspace_id", workspaceId)
            .eq("id", conversationId);

          await db
            .from("contacts")
            .update({ last_seen_at: ts })
            .eq("workspace_id", workspaceId)
            .eq("id", contactId);

          if (insertedMessage?.id) {
            const { error: inboundErr } = await db
              .from("message_events")
              .insert({
                message_id: insertedMessage.id,
                event_type: "inbound.message",
                payload: msg ?? {},
              });
            if (inboundErr) {
              console.log("message_events insert failed (inbound)", inboundErr.message);
            }
          }
        } catch (err) {
          console.log("WEBHOOK_INBOUND_ERROR", err);
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}
