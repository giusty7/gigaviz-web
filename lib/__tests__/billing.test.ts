/**
 * Tests for lib/billing.ts
 *
 * Tests billing info resolution, date formatting, and status mapping.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabaseAdmin
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: mockFrom }),
}));

import { getWorkspaceBilling, normalizePlanId } from "../billing";

// ─── Helpers ────────────────────────────────────────────────────────

let fromCallIndex = 0;

function setupFromSequence(handlers: Array<Record<string, unknown>>) {
  fromCallIndex = 0;
  mockFrom.mockImplementation(() => {
    const handler = handlers[fromCallIndex] ?? handlers[handlers.length - 1];
    fromCallIndex++;
    return handler;
  });
}

function chainSingle(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

// ─── getWorkspaceBilling ────────────────────────────────────────────

describe("getWorkspaceBilling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromCallIndex = 0;
  });

  it("returns billing info for active subscription", async () => {
    setupFromSequence([
      chainSingle({
        plan_id: "starter",
        status: "active",
        current_period_start: "2026-01-01T00:00:00Z",
        current_period_end: "2026-02-01T00:00:00Z",
        billing_mode: "individual",
        seat_limit: 3,
      }),
      chainSingle({
        code: "starter",
        name: "Starter",
        price_cents: 9900,
        currency: "USD",
        is_active: true,
      }),
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.subscription).not.toBeNull();
    expect(result.subscription?.plan_id).toBe("starter");
    expect(result.subscription?.status).toBe("active");
    expect(result.subscription?.seat_limit).toBe(3);
    expect(result.plan).not.toBeNull();
    expect(result.plan?.code).toBe("starter");
    expect(result.plan?.price_cents).toBe(9900);
    expect(result.statusLabel).toBe("Active");
    expect(result.periodLabel).toContain("Periode:");
  });

  it("returns null subscription when none exists", async () => {
    setupFromSequence([
      chainSingle(null), // no subscription
      chainSingle(null), // no plan row (defaults to free_locked lookup)
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.subscription).toBeNull();
    expect(result.statusLabel).toBe("Unknown");
    expect(result.periodLabel).toBe("Period not available yet");
  });

  it("maps status 'trialing' correctly", async () => {
    setupFromSequence([
      chainSingle({
        plan_id: "growth",
        status: "trialing",
        current_period_start: null,
        current_period_end: null,
        billing_mode: "team",
        seat_limit: 10,
      }),
      chainSingle(null),
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.statusLabel).toBe("Trial");
  });

  it("maps status 'past_due' correctly", async () => {
    setupFromSequence([
      chainSingle({
        plan_id: "business",
        status: "past_due",
        current_period_start: null,
        current_period_end: null,
        billing_mode: "team",
        seat_limit: 25,
      }),
      chainSingle(null),
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.statusLabel).toBe("Past due");
  });

  it("maps status 'canceled' correctly", async () => {
    setupFromSequence([
      chainSingle({
        plan_id: "starter",
        status: "canceled",
        current_period_start: null,
        current_period_end: null,
        billing_mode: "individual",
        seat_limit: 3,
      }),
      chainSingle(null),
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.statusLabel).toBe("Canceled");
  });

  it("maps unknown status to 'Unknown'", async () => {
    setupFromSequence([
      chainSingle({
        plan_id: "starter",
        status: "something_weird",
        current_period_start: null,
        current_period_end: null,
        billing_mode: "individual",
        seat_limit: 3,
      }),
      chainSingle(null),
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.statusLabel).toBe("Unknown");
  });

  it("formats period label when both dates are valid", async () => {
    setupFromSequence([
      chainSingle({
        plan_id: "starter",
        status: "active",
        current_period_start: "2026-02-01T00:00:00Z",
        current_period_end: "2026-03-01T00:00:00Z",
        billing_mode: "individual",
        seat_limit: 3,
      }),
      chainSingle(null),
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.periodLabel).toContain("Periode:");
    expect(result.periodLabel).toContain("–");
  });

  it("shows 'Period not available' when dates are missing", async () => {
    setupFromSequence([
      chainSingle({
        plan_id: "starter",
        status: "active",
        current_period_start: null,
        current_period_end: null,
        billing_mode: "individual",
        seat_limit: 3,
      }),
      chainSingle(null),
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.periodLabel).toBe("Period not available yet");
  });

  it("handles invalid date strings gracefully", async () => {
    setupFromSequence([
      chainSingle({
        plan_id: "starter",
        status: "active",
        current_period_start: "not-a-date",
        current_period_end: "also-not-a-date",
        billing_mode: "individual",
        seat_limit: 3,
      }),
      chainSingle(null),
    ]);

    const result = await getWorkspaceBilling("ws_123");

    expect(result.periodLabel).toBe("Period not available yet");
  });
});

// ─── normalizePlanId ────────────────────────────────────────────────

describe("normalizePlanId", () => {
  it("returns known plan IDs as-is", () => {
    expect(normalizePlanId("free")).toBe("free");
    expect(normalizePlanId("starter")).toBe("starter");
    expect(normalizePlanId("growth")).toBe("growth");
    expect(normalizePlanId("business")).toBe("business");
    expect(normalizePlanId("enterprise")).toBe("enterprise");
  });

  it("returns legacy plan IDs", () => {
    expect(normalizePlanId("free_locked")).toBe("free_locked");
    expect(normalizePlanId("ind_starter")).toBe("ind_starter");
    expect(normalizePlanId("team_pro")).toBe("team_pro");
  });

  it("returns free_locked for null/undefined", () => {
    expect(normalizePlanId(null)).toBe("free");
    expect(normalizePlanId(undefined)).toBe("free");
  });

  it("returns free_locked for unknown plan codes", () => {
    // Unknown plan → getPlanMeta falls back to first plan (free)
    const result = normalizePlanId("totally_unknown");
    expect(result).toBe("free");
  });
});
