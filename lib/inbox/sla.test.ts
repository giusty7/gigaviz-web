import { describe, it, expect } from "vitest";
import { computeSla } from "@/lib/inbox/sla";

const baseTime = new Date("2026-01-01T00:00:00.000Z");

describe("computeSla", () => {
  it("returns ok for low priority within SLA window", () => {
    const result = computeSla({
      priority: "low",
      ticketStatus: "open",
      lastCustomerMessageAt: "2026-01-01T00:00:00.000Z",
      now: new Date("2026-01-01T00:10:00.000Z"),
    });
    expect(result.slaStatus).toBe("ok");
    expect(result.nextResponseDueAt).toBeTruthy();
  });

  it("returns due_soon for high priority approaching deadline", () => {
    const result = computeSla({
      priority: "high",
      ticketStatus: "open",
      lastCustomerMessageAt: "2026-01-01T00:00:00.000Z",
      now: new Date("2026-01-01T00:14:00.000Z"),
    });
    expect(result.slaStatus).toBe("due_soon");
  });

  it("returns breached for medium priority past deadline", () => {
    const result = computeSla({
      priority: "med",
      ticketStatus: "open",
      lastCustomerMessageAt: baseTime.toISOString(),
      now: new Date("2026-01-01T01:00:01.000Z"),
    });
    expect(result.slaStatus).toBe("breached");
  });

  it("returns ok for solved tickets regardless of time", () => {
    const result = computeSla({
      priority: "urgent",
      ticketStatus: "solved",
      lastCustomerMessageAt: baseTime.toISOString(),
      now: new Date("2026-01-01T00:01:00.000Z"),
    });
    expect(result.slaStatus).toBe("ok");
  });
});
