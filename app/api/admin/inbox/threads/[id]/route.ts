import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

type ContactRow = {
  id: string;
  name: string | null;
  phone: string | null;
  tags: string[] | null;
  last_seen_at: string | null;
};

type ConversationRow = {
  id: string;
  contact_id: string;
  assigned_to: string | null;
  ticket_status: string;
  priority: string;
  unread_count: number | null;
  last_message_at: string;
  is_archived: boolean | null;
  pinned: boolean | null;
  snoozed_until: string | null;
  last_read_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  text: string;
  ts: string;
  status: string | null;
  wa_message_id: string | null;
  error_reason: string | null;
  media_url: string | null;
  media_mime: string | null;
  media_sha256: string | null;
};

type NoteRow = {
  id: string;
  conversation_id: string;
  text: string;
  ts: string;
  author: string;
};

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
        id: (conv as ConversationRow).id,
        contactId: (conv as ConversationRow).contact_id,
        assignedTo: (conv as ConversationRow).assigned_to ?? undefined,
        ticketStatus: (conv as ConversationRow).ticket_status,
        priority: (conv as ConversationRow).priority,
        unreadCount: (conv as ConversationRow).unread_count ?? 0,
        lastMessageAt: (conv as ConversationRow).last_message_at,
        isArchived: (conv as ConversationRow).is_archived ?? false,
        pinned: (conv as ConversationRow).pinned ?? false,
        snoozedUntil: (conv as ConversationRow).snoozed_until ?? undefined,
        lastReadAt: (conv as ConversationRow).last_read_at ?? undefined,
      },
      contact: {
        id: (contact as ContactRow).id,
        name: (contact as ContactRow).name,
        phone: (contact as ContactRow).phone,
        tags: (contact as ContactRow).tags ?? [],
        lastSeenAt: (contact as ContactRow).last_seen_at ?? undefined,
      },
      messages: (msgs ?? []).map((m: MessageRow) => ({
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
      notes: (nts ?? []).map((n: NoteRow) => ({
        id: n.id,
        conversationId: n.conversation_id,
        text: n.text,
        ts: n.ts,
        author: n.author,
      })),
    })
  );
}
