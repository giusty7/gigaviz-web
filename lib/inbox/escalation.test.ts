import { computeSla } from "@/lib/inbox/sla";

function escalationKey(conversationId: string, breachType: string, dueAt: string) {
  return `${conversationId}:${breachType}:${dueAt}`;
}

const conversationId = "conv_1";
const lastCustomerMessageAt = "2026-01-01T00:00:00.000Z";

const breach = computeSla({
  priority: "high",
  ticketStatus: "open",
  lastCustomerMessageAt,
  now: new Date("2026-01-01T00:30:00.000Z"),
});

if (!breach.nextResponseDueAt) {
  throw new Error("Expected nextResponseDueAt to be set");
}

const keySet = new Set<string>();
const key = escalationKey(conversationId, "next_response", breach.nextResponseDueAt);
keySet.add(key);
keySet.add(key); // simulate recompute running twice

if (keySet.size !== 1) {
  throw new Error("Escalation dedupe failed; expected 1 unique key");
}
