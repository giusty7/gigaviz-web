import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";

const transferSchema = z.object({
  team_id: z.string().uuid("invalid_team_id"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user, role } = auth;
  const { id: conversationId } = await params;

  const rawBody = await req.json().catch(() => null);
  const parsed = transferSchema.safeParse(rawBody);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "team_id_required" },
        { status: 400 }
      )
    );
  }

  const teamId = parsed.data.team_id;

  const { data: team, error: teamErr } = await db
    .from("teams")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", teamId)
    .maybeSingle();

  if (teamErr || !team?.id) {
    return withCookies(
      NextResponse.json({ error: teamErr?.message ?? "team_not_found" }, { status: 404 })
    );
  }

  if (role === "supervisor") {
    const { data: member } = await db
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("member_id", user?.id ?? "")
      .eq("is_active", true)
      .maybeSingle();

    if (!member?.id) {
      return withCookies(
        NextResponse.json({ error: "member_not_in_team" }, { status: 403 })
      );
    }
  }

  const { data: conv, error: convErr } = await db
    .from("conversations")
    .select("id, assigned_to, assigned_member_id, team_id")
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  if (convErr || !conv?.id) {
    return withCookies(
      NextResponse.json({ error: convErr?.message ?? "conversation_not_found" }, { status: 404 })
    );
  }

  const { error: updErr } = await db
    .from("conversations")
    .update({
      team_id: teamId,
      assigned_member_id: null,
      assigned_to: null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId);

  if (updErr) {
    return withCookies(NextResponse.json({ error: updErr.message }, { status: 500 }));
  }

  const { error: eventErr } = await db.from("conversation_events").insert({
    conversation_id: conversationId,
    type: "transfer",
    meta: {
      previous_team_id: conv.team_id ?? null,
      new_team_id: teamId,
      previous_assignee: conv.assigned_member_id ?? conv.assigned_to ?? null,
    },
    created_by: user?.id ?? "system",
  });

  if (eventErr) {
    logger.info("CONVERSATION_EVENT_INSERT_ERROR", eventErr.message);
  }

  const { data: updated, error: readErr } = await db
    .from("conversations")
    .select(
      "id, contact_id, assigned_to, assigned_member_id, team_id, ticket_status, priority, unread_count, last_message_at, next_response_due_at, resolution_due_at, sla_status, last_customer_message_at, is_archived, pinned, snoozed_until, last_read_at"
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
