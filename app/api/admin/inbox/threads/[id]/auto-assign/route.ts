import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";

const autoAssignSchema = z.object({
  team_id: z.string().uuid("invalid_team_id").optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user, role } = auth;
  const { id: conversationId } = await params;

  const url = new URL(req.url);
  const queryTeamId = url.searchParams.get("team_id");
  const rawBody = await req.json().catch(() => null);
  const parsed = autoAssignSchema.safeParse(rawBody ?? {});

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid_team_id" },
        { status: 400 }
      )
    );
  }

  const rawTeamId = queryTeamId ?? parsed.data.team_id ?? null;

  let teamId = rawTeamId;
  if (!teamId) {
    const { data: defaultTeam } = await db
      .from("teams")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("is_default", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    teamId = defaultTeam?.id ?? null;
  }

  if (!teamId) {
    return withCookies(
      NextResponse.json({ error: "team_id_required" }, { status: 400 })
    );
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
      .eq("member_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!member?.id) {
      return withCookies(
        NextResponse.json({ error: "member_not_in_team" }, { status: 403 })
      );
    }
  }

  const { data: assignedMemberId } = await db.rpc("assign_conversation_round_robin", {
    p_conversation_id: conversationId,
    p_team_id: teamId,
  });

  if (!assignedMemberId) {
    return withCookies(
      NextResponse.json({ error: "no_active_member" }, { status: 409 })
    );
  }

  const { data: updated, error: updErr } = await db
    .from("conversations")
    .select(
      "id, contact_id, assigned_to, assigned_member_id, ticket_status, priority, unread_count, last_message_at, next_response_due_at, resolution_due_at, sla_status, last_customer_message_at, is_archived, pinned, snoozed_until, last_read_at, team_id"
    )
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  if (updErr || !updated) {
    return withCookies(
      NextResponse.json({ error: updErr?.message ?? "conversation_not_found" }, { status: 404 })
    );
  }

  const thread = {
    id: updated.id,
    contactId: updated.contact_id,
    assignedTo: updated.assigned_to ?? undefined,
    assignedMemberId: updated.assigned_member_id ?? undefined,
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
    teamId: updated.team_id ?? undefined,
  };

  return withCookies(NextResponse.json({ thread }));
}
