/**
 * Shared types for Ops Console
 * Client-safe - no server-only imports
 */

// Support Tickets
export type SupportTicket = {
  id: string;
  ticketNumber: string;
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo: string | null;
  assignedToEmail: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  dueAt: string | null;
  firstResponseAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketComment = {
  id: string;
  ticketId: string;
  authorId: string;
  authorEmail: string;
  isInternal: boolean;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTicketInput = {
  workspaceId: string;
  userId: string;
  subject: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
};

export type UpdateTicketInput = {
  status?: "open" | "in_progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string | null;
};

export type TicketFilters = {
  status?: string;
  priority?: string;
  overdue?: boolean;
  assignedTo?: string;
  workspaceId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
};

// Canned Responses
export type CannedResponse = {
  id: string;
  workspaceId: string | null;
  title: string;
  content: string;
  shortcut: string | null;
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCannedResponseInput = {
  workspaceId?: string | null;
  title: string;
  content: string;
  shortcut?: string;
  category?: string;
};

export type UpdateCannedResponseInput = {
  title?: string;
  content?: string;
  shortcut?: string | null;
  category?: string;
};

