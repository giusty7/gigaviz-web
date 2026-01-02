import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

type ConversationRow = {
  id: string;
  team_id: string | null;
  assigned_member_id: string | null;
  takeover_by_member_id: string | null;
};

type TeamMemberRow = {
  id: string;
  team_id: string | null;
  member_id: string | null;
  is_active: boolean | null;
};

export async function POST(req: NextRequest, { params }: Ctx) {
  if (process.env.SUPERVISOR_TAKEOVER_ENABLED !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 403 });
  }

  const auth = await requireWorkspaceRole(req, ["supervisor", "admin"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const { id: conversationId } = await params;

  const { data: conv, error: convErr } = await db
    .from("conversations")
    .select("id, team_id, assigned_member_id, takeover_by_member_id")
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  const conversation = conv as ConversationRow | null;
  if (convErr || !conversation?.id) {
    return withCookies(
      NextResponse.json({ error: convErr?.message ?? "conversation_not_found" }, { status: 404 })
    );
  }

  if (conversation.takeover_by_member_id) {
    return withCookies(NextResponse.json({ error: "already_taken_over" }, { status: 400 }));
  }

  let teamMemberQuery = db
    .from("team_members")
    .select("id, team_id, member_id, is_active")
    .eq("member_id", user.id)
    .eq("is_active", true);

  if (conversation.team_id) {
    teamMemberQuery = teamMemberQuery.eq("team_id", conversation.team_id);
  }

  const { data: teamMember, error: teamMemberErr } = await teamMemberQuery.maybeSingle();
  const member = teamMember as TeamMemberRow | null;
  if (teamMemberErr || !member?.id) {
    return withCookies(
      NextResponse.json({ error: "member_not_in_team" }, { status: 400 })
    );
  }

  const { error: updErr } = await db
    .from("conversations")
    .update({
      takeover_prev_assigned_member_id: conversation.assigned_member_id,
      takeover_by_member_id: member.id,
      takeover_at: new Date().toISOString(),
      assigned_member_id: member.id,
      assigned_to: member.id,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId);

  if (updErr) {
    return withCookies(NextResponse.json({ error: updErr.message }, { status: 500 }));
  }

  const { error: eventErr } = await db.from("conversation_events").insert({
    conversation_id: conversationId,
    type: "takeover",
    meta: {
      prev_assigned: conversation.assigned_member_id ?? null,
      new_assigned: member.id,
      by: user.id,
    },
    created_by: user.id,
  });

  if (eventErr) {
    console.log("CONVERSATION_EVENT_INSERT_ERROR", eventErr.message);
  }

  const { data: updated, error: readErr } = await db
    .from("conversations")
    .select(
      "id, contact_id, assigned_to, assigned_member_id, team_id, takeover_by_member_id, takeover_prev_assigned_member_id, takeover_at, ticket_status, priority, unread_count, last_message_at, next_response_due_at, resolution_due_at, sla_status, last_customer_message_at, is_archived, pinned, snoozed_until, last_read_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  if (readErr || !updated) {
    return withCookies(
      NextResponse.json({ error: readErr?.message ?? "conversation_not_found" }, { status: 404 })
    );
  }

  const thread = {
    id: updated.id,
    contactId: updated.contact_id,
    assignedTo: updated.assigned_to ?? undefined,
    assignedMemberId: updated.assigned_member_id ?? undefined,
    teamId: updated.team_id ?? undefined,
    takeoverByMemberId: updated.takeover_by_member_id ?? undefined,
    takeoverPrevAssignedMemberId: updated.takeover_prev_assigned_member_id ?? undefined,
    takeoverAt: updated.takeover_at ?? undefined,
    ticketStatus: updated.ticket_status,
    priority: updated.priority,
    unreadCount: updated.unread_count ?? 0,
    lastMessageAt: updated.last_message_at,
    nextResponseDueAt: updated.next_response_due_at ?? undefined,
    resolutionDueAt: updated.resolution_due_at ?? undefined,
    slaStatus: updated.sla_status ?? undefined,
    lastCustomerMessageAt: updated.last_customer_message_at ?? undefined,
    isArchived: updated.is_archived ?? false,
    pinned: updated.pinned ?? false,
    snoozedUntil: updated.snoozed_until ?? undefined,
    lastReadAt: updated.last_read_at ?? undefined,
  };

  return withCookies(NextResponse.json({ thread }));
}
