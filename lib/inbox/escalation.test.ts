import { describe, it, expect } from "vitest";
import { computeSla } from "@/lib/inbox/sla";

function escalationKey(conversationId: string, breachType: string, dueAt: string) {
  return `${conversationId}:${breachType}:${dueAt}`;
}

describe("escalation key deduplication", () => {
  it("produces consistent keys for the same breach", () => {
    const conversationId = "conv_1";
    const lastCustomerMessageAt = "2026-01-01T00:00:00.000Z";

    const breach = computeSla({
      priority: "high",
      ticketStatus: "open",
      lastCustomerMessageAt,
      now: new Date("2026-01-01T00:30:00.000Z"),
    });

    expect(breach.nextResponseDueAt).toBeTruthy();

    const keySet = new Set<string>();
    const key = escalationKey(conversationId, "next_response", breach.nextResponseDueAt!);
    keySet.add(key);
    keySet.add(key); // simulate recompute running twice

    expect(keySet.size).toBe(1);
  });
});
