import type { Priority, TicketStatus } from "@/lib/inbox/types";

const TICKET_STATUSES: TicketStatus[] = ["open", "pending", "solved", "spam"];
const PRIORITIES: Priority[] = ["low", "med", "high", "urgent"];

export function parseTicketStatus(value: unknown): TicketStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return TICKET_STATUSES.includes(normalized as TicketStatus)
    ? (normalized as TicketStatus)
    : null;
}

export function parsePriority(value: unknown): Priority | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return PRIORITIES.includes(normalized as Priority)
    ? (normalized as Priority)
    : null;
}
