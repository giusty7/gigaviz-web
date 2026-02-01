import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  SupportTicket,
  TicketComment,
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilters,
} from "./types";

// Re-export types for convenience
export type {
  SupportTicket,
  TicketComment,
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilters,
};

/**
 * Create a new support ticket
 */
export async function createTicket(input: CreateTicketInput): Promise<SupportTicket> {
  const db = supabaseAdmin();

  // Get workspace slug
  const { data: workspace } = await db
    .from("workspaces")
    .select("slug")
    .eq("id", input.workspaceId)
    .single();

  // Get user email
  const { data: userData } = await db.auth.admin.getUserById(input.userId);

  const { data, error } = await db
    .from("ops_support_tickets")
    .insert({
      workspace_id: input.workspaceId,
      workspace_slug: workspace?.slug ?? "unknown",
      user_id: input.userId,
      user_email: userData.user?.email ?? "unknown",
      subject: input.subject,
      description: input.description,
      priority: input.priority ?? "medium",
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;

  return mapTicket(data);
}

/**
 * Get ticket by ID
 */
export async function getTicket(ticketId: string): Promise<SupportTicket | null> {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("ops_support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapTicket(data) : null;
}

/**
 * List tickets with filters
 */
export async function listTickets(filters: TicketFilters = {}): Promise<SupportTicket[]> {
  const db = supabaseAdmin();

  let query = db
    .from("ops_support_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo);
  }
  if (filters.workspaceId) {
    query = query.eq("workspace_id", filters.workspaceId);
  }
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.overdue) {
    query = query.lt("due_at", new Date().toISOString());
    query = query.in("status", ["open", "in_progress"]);
  }

  query = query.limit(filters.limit ?? 50);

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapTicket);
}

/**
 * Update ticket
 */
export async function updateTicket(
  ticketId: string,
  input: UpdateTicketInput
): Promise<SupportTicket> {
  const db = supabaseAdmin();

  const updates: Record<string, unknown> = {};

  if (input.status) {
    updates.status = input.status;
    if (input.status === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }
    if (input.status === "closed") {
      updates.closed_at = new Date().toISOString();
    }
  }

  if (input.priority) {
    updates.priority = input.priority;
  }

  if (input.assignedTo !== undefined) {
    updates.assigned_to = input.assignedTo;
    if (input.assignedTo) {
      const { data: adminUser } = await db.auth.admin.getUserById(input.assignedTo);
      updates.assigned_to_email = adminUser.user?.email ?? null;
    } else {
      updates.assigned_to_email = null;
    }
  }

  const { data, error } = await db
    .from("ops_support_tickets")
    .update(updates)
    .eq("id", ticketId)
    .select()
    .single();

  if (error) throw error;

  return mapTicket(data);
}

/**
 * Add comment to ticket
 */
export async function addTicketComment(
  ticketId: string,
  authorId: string,
  authorEmail: string,
  comment: string,
  isInternal: boolean = false
): Promise<TicketComment> {
  const db = supabaseAdmin();

  // Check if this is first admin response
  const ticket = await getTicket(ticketId);
  if (ticket && !ticket.firstResponseAt && !isInternal) {
    await db
      .from("ops_support_tickets")
      .update({ first_response_at: new Date().toISOString() })
      .eq("id", ticketId);
  }

  const { data, error } = await db
    .from("ops_ticket_comments")
    .insert({
      ticket_id: ticketId,
      author_id: authorId,
      author_email: authorEmail,
      comment,
      is_internal: isInternal,
    })
    .select()
    .single();

  if (error) throw error;

  return mapComment(data);
}

/**
 * Get ticket comments
 */
export async function getTicketComments(ticketId: string): Promise<TicketComment[]> {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("ops_ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapComment);
}

/**
 * Get ticket stats
 */
export async function getTicketStats() {
  const db = supabaseAdmin();

  const { data: stats } = await db
    .from("ops_support_tickets")
    .select("status, priority");

  if (!stats) return { total: 0, byStatus: {}, byPriority: {} };

  const byStatus = stats.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byPriority = stats.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: stats.length,
    byStatus,
    byPriority,
  };
}

// Helper mappers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTicket(row: any): SupportTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    workspaceId: row.workspace_id,
    workspaceSlug: row.workspace_slug,
    userId: row.user_id,
    userEmail: row.user_email,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to,
    assignedToEmail: row.assigned_to_email,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    dueAt: row.due_at,
    firstResponseAt: row.first_response_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapComment(row: any): TicketComment {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorEmail: row.author_email,
    isInternal: row.is_internal,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * SLA Helper Functions
 * Re-exported from sla-helpers.ts for backward compatibility
 */
export { isTicketOverdue, getTimeUntilDue, getSLAStatus } from "./sla-helpers";

