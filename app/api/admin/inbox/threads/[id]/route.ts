import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

type ContactRow = {
  id: string;
  name: string | null;
  phone: string | null;
  tags: string[] | null;
  last_seen_at: string | null;
  comms_status: string | null;
};

type ConversationRow = {
  id: string;
  contact_id: string;
  assigned_to: string | null;
  assigned_member_id: string | null;
  team_id: string | null;
  ticket_status: string;
  priority: string;
  unread_count: number | null;
  last_message_at: string;
  next_response_due_at: string | null;
  resolution_due_at: string | null;
  sla_status: string | null;
  last_customer_message_at: string | null;
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

type AttachmentRow = {
  id: string;
  message_id: string;
  kind: string;
  mime_type: string | null;
  file_name: string | null;
  size_bytes: number | null;
  url: string | null;
  storage_path: string | null;
  thumb_path: string | null;
};

type NoteRow = {
  id: string;
  conversation_id: string;
  text: string;
  ts: string;
  author: string;
};

type EscalationRow = {
  id: string;
  conversation_id: string;
  breach_type: string;
  due_at: string;
  reason: string;
  created_at: string;
  created_by: string;
};

type TeamRow = {
  id: string;
  name: string | null;
};

type TeamMemberRow = {
  id: string;
  member_id: string | null;
};

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const { data: conv, error: convErr } = await db
    .from("conversations")
    .select(
      "id, contact_id, assigned_to, assigned_member_id, team_id, ticket_status, priority, unread_count, last_message_at, next_response_due_at, resolution_due_at, sla_status, last_customer_message_at, is_archived, pinned, snoozed_until, last_read_at"
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
    .select("id, name, phone, tags, last_seen_at, comms_status")
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

  const { data: escs, error: eErr } = await db
    .from("conversation_escalations")
    .select("id, conversation_id, breach_type, due_at, reason, created_at, created_by")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false });

  if (eErr) {
    console.log("ESCALATIONS_SELECT_ERROR", eErr.message);
  }

  let teamName: string | null = null;
  let assignedMemberUserId: string | null = null;
  if ((conv as ConversationRow).team_id) {
    const { data: team } = await db
      .from("teams")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .eq("id", (conv as ConversationRow).team_id)
      .maybeSingle();
    teamName = (team as TeamRow | null)?.name ?? null;
  }

  if ((conv as ConversationRow).assigned_member_id) {
    const { data: member } = await db
      .from("team_members")
      .select("id, member_id")
      .eq("id", (conv as ConversationRow).assigned_member_id)
      .maybeSingle();
    assignedMemberUserId = (member as TeamMemberRow | null)?.member_id ?? null;
  }

  const messageIds = (msgs ?? []).map((m: MessageRow) => m.id);
  const attachmentsByMessage: Record<string, AttachmentRow[]> = {};
  if (messageIds.length > 0) {
    const { data: attachments, error: aErr } = await db
      .from("message_attachments")
      .select("id, message_id, kind, mime_type, file_name, size_bytes, url, storage_path, thumb_path")
      .in("message_id", messageIds);

    if (!aErr && attachments) {
      (attachments as AttachmentRow[]).forEach((a) => {
        if (!attachmentsByMessage[a.message_id]) attachmentsByMessage[a.message_id] = [];
        attachmentsByMessage[a.message_id].push(a);
      });
    } else if (aErr) {
      console.log("ATTACHMENTS_SELECT_ERROR", aErr.message);
    }
  }

  return withCookies(
    NextResponse.json({
      thread: {
        id: (conv as ConversationRow).id,
        contactId: (conv as ConversationRow).contact_id,
        assignedTo: (conv as ConversationRow).assigned_to ?? undefined,
        assignedMemberId: (conv as ConversationRow).assigned_member_id ?? undefined,
        teamId: (conv as ConversationRow).team_id ?? undefined,
        teamName: teamName ?? undefined,
        assignedMemberUserId: assignedMemberUserId ?? undefined,
        ticketStatus: (conv as ConversationRow).ticket_status,
        priority: (conv as ConversationRow).priority,
        unreadCount: (conv as ConversationRow).unread_count ?? 0,
        lastMessageAt: (conv as ConversationRow).last_message_at,
        nextResponseDueAt: (conv as ConversationRow).next_response_due_at ?? undefined,
        resolutionDueAt: (conv as ConversationRow).resolution_due_at ?? undefined,
        slaStatus: (conv as ConversationRow).sla_status ?? undefined,
        lastCustomerMessageAt:
          (conv as ConversationRow).last_customer_message_at ?? undefined,
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
        commsStatus: (contact as ContactRow).comms_status ?? "normal",
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
        attachments: (attachmentsByMessage[m.id] ?? []).map((a) => ({
          id: a.id,
          kind: a.kind,
          mimeType: a.mime_type ?? undefined,
          fileName: a.file_name ?? undefined,
          sizeBytes: a.size_bytes ?? undefined,
          url: a.url ?? undefined,
          requiresSign: Boolean(a.storage_path),
          hasThumb: Boolean(a.thumb_path),
        })),
      })),
      notes: (nts ?? []).map((n: NoteRow) => ({
        id: n.id,
        conversationId: n.conversation_id,
        text: n.text,
        ts: n.ts,
        author: n.author,
      })),
      escalations: (escs ?? []).map((e: EscalationRow) => ({
        id: e.id,
        conversationId: e.conversation_id,
        breachType: e.breach_type,
        dueAt: e.due_at,
        reason: e.reason,
        createdAt: e.created_at,
        createdBy: e.created_by,
      })),
    })
  );
}
