import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const { data: conv, error: convErr } = await db
    .from("conversations")
    .select(
      "id, contact_id, assigned_to, ticket_status, priority, unread_count, last_message_at, is_archived, pinned, snoozed_until, last_read_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .single();

  if (convErr || !conv) {
    return withCookies(
      NextResponse.json({ error: convErr?.message ?? "conversation_not_found" }, { status: 404 })
    );
  }

  const { data: contact, error: cErr } = await db
    .from("contacts")
    .select("id, name, phone, tags, last_seen_at")
    .eq("workspace_id", workspaceId)
    .eq("id", conv.contact_id)
    .single();

  if (cErr || !contact) {
    return withCookies(
      NextResponse.json({ error: cErr?.message ?? "contact_not_found" }, { status: 404 })
    );
  }

  const { data: msgs, error: mErr } = await db
    .from("messages")
    .select("id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", id)
    .order("ts", { ascending: true });

  if (mErr) return withCookies(NextResponse.json({ error: mErr.message }, { status: 500 }));

  const { data: nts, error: nErr } = await db
    .from("notes")
    .select("id, conversation_id, text, ts, author")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", id)
    .order("ts", { ascending: false });

  if (nErr) return withCookies(NextResponse.json({ error: nErr.message }, { status: 500 }));

  return withCookies(
    NextResponse.json({
      thread: {
        id: conv.id,
        contactId: conv.contact_id,
        assignedTo: conv.assigned_to ?? undefined,
        ticketStatus: conv.ticket_status,
        priority: conv.priority,
        unreadCount: conv.unread_count ?? 0,
        lastMessageAt: conv.last_message_at,
        isArchived: conv.is_archived ?? false,
        pinned: conv.pinned ?? false,
        snoozedUntil: conv.snoozed_until ?? undefined,
        lastReadAt: conv.last_read_at ?? undefined,
      },
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        tags: contact.tags ?? [],
        lastSeenAt: contact.last_seen_at ?? undefined,
      },
      messages: (msgs ?? []).map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        direction: m.direction,
        text: m.text,
        ts: m.ts,
        status: m.status ?? undefined,
        waMessageId: m.wa_message_id ?? undefined,
        errorReason: m.error_reason ?? undefined,
        mediaUrl: m.media_url ?? undefined,
        mediaMime: m.media_mime ?? undefined,
        mediaSha256: m.media_sha256 ?? undefined,
      })),
      notes: (nts ?? []).map((n: any) => ({
        id: n.id,
        conversationId: n.conversation_id,
        text: n.text,
        ts: n.ts,
        author: n.author,
      })),
    })
  );
}
