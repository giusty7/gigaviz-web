import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { recomputeConversationSla } from "@/lib/inbox/sla";
import { parsePriority, parseTicketStatus } from "@/lib/inbox/validators";

const conversationPatchSchema = z.object({
  ticketStatus: z.unknown().optional(),
  ticket_status: z.unknown().optional(),
  priority: z.unknown().optional(),
  assignedTo: z.unknown().optional(),
  assigned_to: z.unknown().optional(),
  assigned_member_id: z.unknown().optional(),
  team_id: z.unknown().optional(),
  unreadCount: z.unknown().optional(),
  unread_count: z.unknown().optional(),
  isArchived: z.unknown().optional(),
  is_archived: z.unknown().optional(),
  pinned: z.unknown().optional(),
  snoozedUntil: z.unknown().optional(),
  snoozed_until: z.unknown().optional(),
  lastReadAt: z.unknown().optional(),
  last_read_at: z.unknown().optional(),
}).strict();

type Ctx = { params: Promise<{ id: string }> };

type ConversationPatch = {
  ticket_status?: string;
  priority?: string;
  assigned_to?: string | null;
  assigned_member_id?: string | null;
  team_id?: string | null;
  unread_count?: number;
  is_archived?: boolean;
  pinned?: boolean;
  snoozed_until?: string | null;
  last_read_at?: string | null;
};

function parseBool(value: unknown) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseIso(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }
  return null;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const rawBody = await req.json().catch(() => null);
  const parsed = conversationPatchSchema.safeParse(rawBody);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid_input" },
        { status: 400 }
      )
    );
  }

  const body = parsed.data;

  const patch: ConversationPatch = {};
  if (body?.ticketStatus !== undefined || body?.ticket_status !== undefined) {
    const parsed = parseTicketStatus(body?.ticketStatus ?? body?.ticket_status);
    if (!parsed) {
      return withCookies(
        NextResponse.json({ error: "invalid_ticket_status" }, { status: 400 })
      );
    }
    patch.ticket_status = parsed;
  }
  if (body?.priority !== undefined) {
    const parsed = parsePriority(body.priority);
    if (!parsed) {
      return withCookies(
        NextResponse.json({ error: "invalid_priority" }, { status: 400 })
      );
    }
    patch.priority = parsed;
  }
  if (body?.assignedTo !== undefined || body?.assigned_to !== undefined) {
    const assigned = body?.assignedTo ?? body?.assigned_to;
    patch.assigned_to = assigned === null ? null : String(assigned);
  }
  if (body?.assigned_member_id !== undefined) {
    const assignedMember = body?.assigned_member_id;
    patch.assigned_member_id = assignedMember === null ? null : String(assignedMember);
  }
  if (body?.team_id !== undefined) {
    const teamId = body?.team_id;
    patch.team_id = teamId === null ? null : String(teamId);
  }
  if (body?.unreadCount !== undefined || body?.unread_count !== undefined) {
    patch.unread_count = Number(body?.unreadCount ?? body?.unread_count) || 0;
  }
  if (body?.isArchived !== undefined || body?.is_archived !== undefined) {
    const val = parseBool(body?.isArchived ?? body?.is_archived);
    if (val !== undefined) patch.is_archived = val;
  }
  if (body?.pinned !== undefined) {
    const val = parseBool(body.pinned);
    if (val !== undefined) patch.pinned = val;
  }
  if (body?.snoozedUntil !== undefined || body?.snoozed_until !== undefined) {
    const snooze = body?.snoozedUntil ?? body?.snoozed_until;
    patch.snoozed_until = parseIso(snooze);
  }
  if (body?.lastReadAt !== undefined || body?.last_read_at !== undefined) {
    const lastRead = body?.lastReadAt ?? body?.last_read_at;
    patch.last_read_at = parseIso(lastRead);
  }

  if (Object.keys(patch).length === 0) {
    return withCookies(NextResponse.json({ error: "no_fields" }, { status: 400 }));
  }

  const { data, error } = await db
    .from("conversations")
    .update(patch)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select(
      "id, contact_id, assigned_to, assigned_member_id, team_id, ticket_status, priority, unread_count, last_message_at, next_response_due_at, resolution_due_at, sla_status, last_customer_message_at, is_archived, pinned, snoozed_until, last_read_at"
    )
    .single();

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  const thread = {
    id: data.id,
    contactId: data.contact_id,
    assignedTo: data.assigned_to ?? undefined,
    assignedMemberId: data.assigned_member_id ?? undefined,
    ticketStatus: data.ticket_status,
    priority: data.priority,
    unreadCount: data.unread_count ?? 0,
    lastMessageAt: data.last_message_at,
    nextResponseDueAt: data.next_response_due_at ?? undefined,
    resolutionDueAt: data.resolution_due_at ?? undefined,
    slaStatus: data.sla_status ?? undefined,
    lastCustomerMessageAt: data.last_customer_message_at ?? undefined,
    isArchived: data.is_archived ?? false,
    pinned: data.pinned ?? false,
    snoozedUntil: data.snoozed_until ?? undefined,
    lastReadAt: data.last_read_at ?? undefined,
    teamId: data.team_id ?? undefined,
  };

  if (patch.ticket_status || patch.priority) {
    await recomputeConversationSla({
      db,
      workspaceId,
      conversationId: id,
      overrides: {
        priority: patch.priority as "low" | "med" | "high" | "urgent" | null,
        ticketStatus: patch.ticket_status as "open" | "pending" | "solved" | "spam" | null,
      },
    });
  }

  return withCookies(NextResponse.json({ thread }));
}
