import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isTicketOverdue, getTimeUntilDue, getSLAStatus } from "../sla-helpers";
import type { SupportTicket } from "../types";

/** Build a partial SupportTicket for tests */
function ticket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: "t-1",
    ticketNumber: "T-001",
    workspaceId: "ws-1",
    workspaceSlug: "acme",
    userId: "u-1",
    userEmail: "user@test.com",
    subject: "Test ticket",
    description: "Test",
    status: "open",
    priority: "medium",
    assignedTo: null,
    assignedToEmail: null,
    resolvedAt: null,
    closedAt: null,
    dueAt: null,
    firstResponseAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("isTicketOverdue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-08T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns false when dueAt is null", () => {
    expect(isTicketOverdue(ticket({ dueAt: null }))).toBe(false);
  });

  it("returns false when status is resolved", () => {
    const past = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(isTicketOverdue(ticket({ dueAt: past, status: "resolved" }))).toBe(false);
  });

  it("returns false when status is closed", () => {
    const past = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(isTicketOverdue(ticket({ dueAt: past, status: "closed" }))).toBe(false);
  });

  it("returns true when dueAt is in the past and status is open", () => {
    const past = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(isTicketOverdue(ticket({ dueAt: past, status: "open" }))).toBe(true);
  });

  it("returns true when dueAt is in the past and status is in_progress", () => {
    const past = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(isTicketOverdue(ticket({ dueAt: past, status: "in_progress" }))).toBe(true);
  });

  it("returns false when dueAt is in the future", () => {
    const future = new Date("2026-02-09T12:00:00Z").toISOString();
    expect(isTicketOverdue(ticket({ dueAt: future, status: "open" }))).toBe(false);
  });
});

describe("getTimeUntilDue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-08T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns null when dueAt is null", () => {
    expect(getTimeUntilDue(ticket({ dueAt: null }))).toBeNull();
  });

  it('returns "Overdue" when dueAt is in the past', () => {
    const past = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(getTimeUntilDue(ticket({ dueAt: past }))).toBe("Overdue");
  });

  it("returns days format for > 24h remaining", () => {
    const future = new Date("2026-02-11T12:00:00Z").toISOString(); // 3 days
    expect(getTimeUntilDue(ticket({ dueAt: future }))).toBe("3d");
  });

  it("returns hours format for > 1h remaining", () => {
    const future = new Date("2026-02-08T17:00:00Z").toISOString(); // 5 hours
    expect(getTimeUntilDue(ticket({ dueAt: future }))).toBe("5h");
  });

  it("returns minutes format for < 1h remaining", () => {
    const future = new Date("2026-02-08T12:45:00Z").toISOString(); // 45 minutes
    expect(getTimeUntilDue(ticket({ dueAt: future }))).toBe("45m");
  });

  it("returns 0m for exactly now", () => {
    const now = new Date("2026-02-08T12:00:00Z").toISOString();
    // At exact time, diff is 0 — not negative, so 0m
    expect(getTimeUntilDue(ticket({ dueAt: now }))).toBe("0m");
  });
});

describe("getSLAStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-08T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it('returns "ok" when dueAt is null', () => {
    expect(getSLAStatus(ticket({ dueAt: null }))).toBe("ok");
  });

  it('returns "ok" when status is resolved', () => {
    const past = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(getSLAStatus(ticket({ dueAt: past, status: "resolved" }))).toBe("ok");
  });

  it('returns "ok" when status is closed', () => {
    const past = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(getSLAStatus(ticket({ dueAt: past, status: "closed" }))).toBe("ok");
  });

  it('returns "overdue" when past due and open', () => {
    const past = new Date("2026-02-07T12:00:00Z").toISOString();
    expect(getSLAStatus(ticket({ dueAt: past, status: "open" }))).toBe("overdue");
  });

  it('returns "warning" when < 4 hours remaining', () => {
    const soon = new Date("2026-02-08T14:00:00Z").toISOString(); // 2h left
    expect(getSLAStatus(ticket({ dueAt: soon, status: "open" }))).toBe("warning");
  });

  it('returns "ok" when >= 4 hours remaining', () => {
    const later = new Date("2026-02-08T18:00:00Z").toISOString(); // 6h left
    expect(getSLAStatus(ticket({ dueAt: later, status: "open" }))).toBe("ok");
  });

  it('returns "warning" at exactly 3h59m remaining', () => {
    const borderline = new Date("2026-02-08T15:59:00Z").toISOString();
    expect(getSLAStatus(ticket({ dueAt: borderline, status: "in_progress" }))).toBe("warning");
  });
});
