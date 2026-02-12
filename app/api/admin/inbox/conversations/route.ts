import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;

  const { data, error } = await db
    .from("conversations")
    .select(
      `
      id,
      contact_id,
      assigned_to,
      assigned_member_id,
      ticket_status,
      priority,
      unread_count,
      last_message_at,
      next_response_due_at,
      resolution_due_at,
      sla_status,
      last_customer_message_at,
      contacts:contacts (
        id, name, phone, tags, last_seen_at
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("last_message_at", { ascending: false });

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  // map -> camelCase biar cocok sama UI
  type ContactRow = {
    id: string;
    name: string | null;
    phone: string | null;
    tags: string[] | null;
    last_seen_at: string | null;
  };

  type ContactRelation = ContactRow | ContactRow[] | null;

  type ConversationRow = {
    id: string;
    contact_id: string;
      assigned_to: string | null;
      assigned_member_id: string | null;
      ticket_status: string;
      priority: string;
      unread_count: number;
      last_message_at: string;
    next_response_due_at: string | null;
    resolution_due_at: string | null;
    sla_status: string | null;
    last_customer_message_at: string | null;
    contacts: ContactRelation;
  };

  const conversations = (data ?? []).map((row: ConversationRow) => {
    const contact = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts;
    return {
      id: row.id,
      contactId: row.contact_id,
      assignedTo: row.assigned_to ?? undefined,
      assignedMemberId: row.assigned_member_id ?? undefined,
      ticketStatus: row.ticket_status,
      priority: row.priority,
      unreadCount: row.unread_count,
      lastMessageAt: row.last_message_at,
      nextResponseDueAt: row.next_response_due_at ?? undefined,
      resolutionDueAt: row.resolution_due_at ?? undefined,
      slaStatus: row.sla_status ?? undefined,
      lastCustomerMessageAt: row.last_customer_message_at ?? undefined,
      contact: contact
        ? {
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            tags: contact.tags ?? [],
            lastSeenAt: contact.last_seen_at ?? null,
          }
        : null,
    };
  });

  return withCookies(NextResponse.json({ conversations }));
});
