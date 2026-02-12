import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

type ConversationRow = {
  id: string;
  team_id: string | null;
  assigned_member_id: string | null;
  takeover_by_member_id: string | null;
  takeover_prev_assigned_member_id: string | null;
};

type TeamMemberRow = {
  id: string;
  team_id: string | null;
  is_active: boolean | null;
};

export const POST = withErrorHandler(async (req: NextRequest, { params }: Ctx) => {
  if (process.env.SUPERVISOR_TAKEOVER_ENABLED !== "true") {
    return NextResponse.json({ error: "feature_disabled" }, { status: 403 });
  }

  const auth = await requireWorkspaceRole(req, ["supervisor", "admin"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const { id: conversationId } = await params;

  const { data: conv, error: convErr } = await db
    .from("conversations")
    .select(
      "id, team_id, assigned_member_id, takeover_by_member_id, takeover_prev_assigned_member_id"
    )
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  const conversation = conv as ConversationRow | null;
  if (convErr || !conversation?.id) {
    return withCookies(
      NextResponse.json({ error: convErr?.message ?? "conversation_not_found" }, { status: 404 })
    );
  }

  if (!conversation.takeover_by_member_id) {
    return withCookies(NextResponse.json({ error: "not_taken_over" }, { status: 400 }));
  }

  let restoredMemberId: string | null = null;
  if (conversation.takeover_prev_assigned_member_id) {
    const memberQuery = db
      .from("team_members")
      .select("id, team_id, is_active")
      .eq("id", conversation.takeover_prev_assigned_member_id)
      .eq("is_active", true);

    const { data: member } = await memberQuery.maybeSingle();
    const prevMember = member as TeamMemberRow | null;

    if (prevMember?.id) {
      if (!conversation.team_id || prevMember.team_id === conversation.team_id) {
        restoredMemberId = prevMember.id;
      }
    }
  }

  const updatePayload: Record<string, unknown> = {
    takeover_by_member_id: null,
    takeover_prev_assigned_member_id: null,
    takeover_at: null,
  };

  if (restoredMemberId) {
    updatePayload.assigned_member_id = restoredMemberId;
    updatePayload.assigned_to = restoredMemberId;
  } else {
    updatePayload.assigned_member_id = null;
    updatePayload.assigned_to = null;
  }

  const { error: updErr } = await db
    .from("conversations")
    .update(updatePayload)
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId);

  if (updErr) {
    return withCookies(NextResponse.json({ error: updErr.message }, { status: 500 }));
  }

  let autoAssignedMemberId: string | null = null;
  if (!restoredMemberId && conversation.team_id) {
    const { data: assignedMemberId, error: rpcErr } = await db.rpc(
      "assign_conversation_round_robin",
      {
        p_conversation_id: conversationId,
        p_team_id: conversation.team_id,
      }
    );

    if (rpcErr) {
      logger.info("CONVERSATION_AUTO_ASSIGN_ERROR", rpcErr.message);
    } else {
      autoAssignedMemberId = assignedMemberId as string | null;
    }
  }

  const { error: eventErr } = await db.from("conversation_events").insert({
    conversation_id: conversationId,
    type: "release_takeover",
    meta: {
      prev_assigned: conversation.assigned_member_id ?? null,
      restored_assigned: restoredMemberId,
      auto_assigned: autoAssignedMemberId,
      by: user.id,
    },
    created_by: user.id,
  });

  if (eventErr) {
    logger.info("CONVERSATION_EVENT_INSERT_ERROR", eventErr.message);
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
});
