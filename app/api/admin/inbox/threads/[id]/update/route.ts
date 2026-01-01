import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));

  const patch: Record<string, any> = {};
  if (body.ticketStatus !== undefined) patch.ticket_status = body.ticketStatus;
  if (body.priority !== undefined) patch.priority = body.priority;
  if (body.assignedTo !== undefined) patch.assigned_to = body.assignedTo || null;
  if (body.unreadCount !== undefined) patch.unread_count = Number(body.unreadCount) || 0;

  if (Object.keys(patch).length === 0) {
    return withCookies(NextResponse.json({ error: "no_fields" }, { status: 400 }));
  }

  const { data, error } = await db
    .from("conversations")
    .update(patch)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select("id, contact_id, assigned_to, ticket_status, priority, unread_count, last_message_at")
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
  };

  return withCookies(NextResponse.json({ thread }));
}
