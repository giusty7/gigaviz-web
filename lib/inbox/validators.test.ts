import { parsePriority, parseTicketStatus } from "@/lib/inbox/validators";

function assertEqual<T>(label: string, actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`${label} expected=${String(expected)} actual=${String(actual)}`);
  }
}

assertEqual("valid ticket status", parseTicketStatus("open"), "open");
assertEqual("invalid ticket status", parseTicketStatus("closed"), null);

assertEqual("valid priority", parsePriority("urgent"), "urgent");
assertEqual("invalid priority", parsePriority("lowest"), null);
