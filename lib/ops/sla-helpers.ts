/**
 * SLA Helper Functions (Client-safe)
 * Can be imported by both client and server components
 */

import type { SupportTicket } from "./types";

export function isTicketOverdue(ticket: SupportTicket): boolean {
  if (!ticket.dueAt) return false;
  if (ticket.status === "resolved" || ticket.status === "closed") return false;
  return new Date(ticket.dueAt) < new Date();
}

export function getTimeUntilDue(ticket: SupportTicket): string | null {
  if (!ticket.dueAt) return null;
  
  const now = new Date();
  const due = new Date(ticket.dueAt);
  const diffMs = due.getTime() - now.getTime();
  
  if (diffMs < 0) return "Overdue";
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 1) return `${diffDays}d`;
  if (diffHours > 1) return `${diffHours}h`;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `${diffMinutes}m`;
}

export function getSLAStatus(ticket: SupportTicket): "ok" | "warning" | "overdue" {
  if (!ticket.dueAt) return "ok";
  if (ticket.status === "resolved" || ticket.status === "closed") return "ok";
  
  const now = new Date();
  const due = new Date(ticket.dueAt);
  const diffMs = due.getTime() - now.getTime();
  
  if (diffMs < 0) return "overdue";
  
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 4) return "warning"; // Less than 4 hours remaining
  
  return "ok";
}
