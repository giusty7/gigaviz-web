import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function parseBool(value: any) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseIso(value: any) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};

  if (body.ticketStatus !== undefined || body.ticket_status !== undefined) {
    patch.ticket_status = body.ticketStatus ?? body.ticket_status;
  }
  if (body.priority !== undefined) patch.priority = body.priority;
  if (body.assignedTo !== undefined || body.assigned_to !== undefined) {
    patch.assigned_to = body.assignedTo ?? body.assigned_to ?? null;
  }
  if (body.unreadCount !== undefined || body.unread_count !== undefined) {
    patch.unread_count = Number(body.unreadCount ?? body.unread_count) || 0;
  }
  if (body.isArchived !== undefined || body.is_archived !== undefined) {
    const val = parseBool(body.isArchived ?? body.is_archived);
    if (val !== undefined) patch.is_archived = val;
  }
  if (body.pinned !== undefined) {
    const val = parseBool(body.pinned);
    if (val !== undefined) patch.pinned = val;
  }
  if (body.snoozedUntil !== undefined || body.snoozed_until !== undefined) {
    const snooze = body.snoozedUntil ?? body.snoozed_until;
    patch.snoozed_until = parseIso(snooze);
  }
  if (body.lastReadAt !== undefined || body.last_read_at !== undefined) {
    const lastRead = body.lastReadAt ?? body.last_read_at;
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
      "id, contact_id, assigned_to, ticket_status, priority, unread_count, last_message_at, is_archived, pinned, snoozed_until, last_read_at"
    )
    .single();

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  const thread = {
    id: data.id,
    contactId: data.contact_id,
    assignedTo: data.assigned_to ?? undefined,
    ticketStatus: data.ticket_status,
    priority: data.priority,
    unreadCount: data.unread_count ?? 0,
    lastMessageAt: data.last_message_at,
    isArchived: data.is_archived ?? false,
    pinned: data.pinned ?? false,
    snoozedUntil: data.snoozed_until ?? undefined,
    lastReadAt: data.last_read_at ?? undefined,
  };

  return withCookies(NextResponse.json({ thread }));
}
