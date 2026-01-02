import { computeSla } from "@/lib/inbox/sla";

function assertEqual<T>(label: string, actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`${label} expected=${String(expected)} actual=${String(actual)}`);
  }
}

function assertTruthy(label: string, value: unknown) {
  if (!value) {
    throw new Error(`${label} expected truthy value`);
  }
}

const baseTime = new Date("2026-01-01T00:00:00.000Z");

const ok = computeSla({
  priority: "low",
  ticketStatus: "open",
  lastCustomerMessageAt: "2026-01-01T00:00:00.000Z",
  now: new Date("2026-01-01T00:10:00.000Z"),
});
assertEqual("status ok", ok.slaStatus, "ok");
assertTruthy("nextResponseDueAt set", ok.nextResponseDueAt);

const dueSoon = computeSla({
  priority: "high",
  ticketStatus: "open",
  lastCustomerMessageAt: "2026-01-01T00:00:00.000Z",
  now: new Date("2026-01-01T00:14:00.000Z"),
});
assertEqual("status due_soon", dueSoon.slaStatus, "due_soon");

const breached = computeSla({
  priority: "med",
  ticketStatus: "open",
  lastCustomerMessageAt: baseTime.toISOString(),
  now: new Date("2026-01-01T01:00:01.000Z"),
});
assertEqual("status breached", breached.slaStatus, "breached");

const solved = computeSla({
  priority: "urgent",
  ticketStatus: "solved",
  lastCustomerMessageAt: baseTime.toISOString(),
  now: new Date("2026-01-01T00:01:00.000Z"),
});
assertEqual("status solved ok", solved.slaStatus, "ok");
