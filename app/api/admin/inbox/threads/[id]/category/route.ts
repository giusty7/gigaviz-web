import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { isSkillRoutingEnabled, routeToCategoryTeam } from "@/lib/inbox/routing";

const categorySchema = z.object({
  category_id: z.union([
    z.string().uuid("invalid_category_id"),
    z.literal(""),
    z.null(),
  ]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const { id: conversationId } = await params;

  const rawBody = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(rawBody);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "category_id_required" },
        { status: 400 }
      )
    );
  }

  let categoryId: string | null = null;
  if (parsed.data.category_id === null || parsed.data.category_id === "") {
    categoryId = null;
  } else {
    categoryId = parsed.data.category_id;
  }

  if (categoryId) {
    const { data: category, error: categoryErr } = await db
      .from("routing_categories")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("id", categoryId)
      .maybeSingle();

    if (categoryErr || !category?.id) {
      return withCookies(
        NextResponse.json({ error: categoryErr?.message ?? "category_not_found" }, { status: 404 })
      );
    }
  }

  const { data: updated, error: updErr } = await db
    .from("conversations")
    .update({ category_id: categoryId })
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .select(
      "id, contact_id, assigned_to, assigned_member_id, team_id, category_id, ticket_status, priority, unread_count, last_message_at, next_response_due_at, resolution_due_at, sla_status, last_customer_message_at, is_archived, pinned, snoozed_until, last_read_at"
    )
    .maybeSingle();

  if (updErr) {
    return withCookies(NextResponse.json({ error: updErr.message }, { status: 500 }));
  }

  if (!updated?.id) {
    return withCookies(
      NextResponse.json({ error: "conversation_not_found" }, { status: 404 })
    );
  }

  if (isSkillRoutingEnabled() && categoryId) {
    const routed = await routeToCategoryTeam({
      db,
      workspaceId,
      conversationId,
      createdBy: user?.id ?? "system",
    });

    if (!routed.ok) {
      return withCookies(
        NextResponse.json({ error: routed.error ?? "routing_failed" }, { status: 500 })
      );
    }
  }

  const { data: refreshed, error: refreshErr } = await db
    .from("conversations")
    .select(
      "id, contact_id, assigned_to, assigned_member_id, team_id, category_id, ticket_status, priority, unread_count, last_message_at, next_response_due_at, resolution_due_at, sla_status, last_customer_message_at, is_archived, pinned, snoozed_until, last_read_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  if (refreshErr || !refreshed?.id) {
    return withCookies(
      NextResponse.json({ error: refreshErr?.message ?? "conversation_not_found" }, { status: 404 })
    );
  }

  const thread = {
    id: refreshed.id,
    contactId: refreshed.contact_id,
    assignedTo: refreshed.assigned_to ?? undefined,
    assignedMemberId: refreshed.assigned_member_id ?? undefined,
    teamId: refreshed.team_id ?? undefined,
    categoryId: refreshed.category_id ?? undefined,
    ticketStatus: refreshed.ticket_status,
    priority: refreshed.priority,
    unreadCount: refreshed.unread_count ?? 0,
    lastMessageAt: refreshed.last_message_at,
    nextResponseDueAt: refreshed.next_response_due_at ?? undefined,
    resolutionDueAt: refreshed.resolution_due_at ?? undefined,
    slaStatus: refreshed.sla_status ?? undefined,
    lastCustomerMessageAt: refreshed.last_customer_message_at ?? undefined,
    isArchived: refreshed.is_archived ?? false,
    pinned: refreshed.pinned ?? false,
    snoozedUntil: refreshed.snoozed_until ?? undefined,
    lastReadAt: refreshed.last_read_at ?? undefined,
  };

  return withCookies(NextResponse.json({ thread }));
}
