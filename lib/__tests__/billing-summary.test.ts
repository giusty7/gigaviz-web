/**
 * Tests for lib/billing/summary.ts
 *
 * Tests getBillingSummary with various subscription states.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock supabase admin
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

// Mock tokens module (called by getBillingSummary)
vi.mock("@/lib/tokens", () => ({
  getWallet: vi.fn().mockResolvedValue({
    workspace_id: "ws_test",
    balance_bigint: 2500,
    updated_at: "2025-01-01T00:00:00Z",
  }),
  getTokenSettings: vi.fn().mockResolvedValue({
    monthly_cap: null,
    alert_threshold: 80,
    hard_cap: false,
    updated_at: null,
  }),
  getTokenUsage: vi.fn().mockResolvedValue({
    used: 0,
    dailyUsage: [],
    yyyymm: "202501",
    periodStart: "2025-01-01T00:00:00.000Z",
    periodEnd: "2025-02-01T00:00:00.000Z",
  }),
}));

import { getBillingSummary } from "../billing/summary";

// ─── Helpers ────────────────────────────────────────────────────────

function chainBuilder(resolveData: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolveData, error }),
  };
  // Also make it thenable for queries that resolve as arrays
  Object.defineProperty(builder, "then", {
    value: (resolve: (v: { data: unknown; error: unknown }) => void) =>
      Promise.resolve({ data: resolveData, error }).then(resolve),
    writable: true,
  });
  return builder;
}

let fromCallIndex = 0;
let fromHandlers: Array<Record<string, unknown>> = [];

function setupFromSequence(handlers: Array<Record<string, unknown>>) {
  fromCallIndex = 0;
  fromHandlers = handlers;
  mockFrom.mockImplementation(() => {
    const handler = fromHandlers[fromCallIndex] ?? fromHandlers[fromHandlers.length - 1];
    fromCallIndex++;
    return handler;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  fromCallIndex = 0;
  fromHandlers = [];
});

// ─── getBillingSummary ──────────────────────────────────────────────

describe("getBillingSummary", () => {
  it("returns summary with null subscription when no subscription found", async () => {
    setupFromSequence([
      chainBuilder(null), // subscriptions → not found
      chainBuilder(null), // plans → not found (for free_locked code)
      chainBuilder([]),    // plans list
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.subscription).toBeNull();
    expect(result.statusLabel).toBe("Unknown");
    expect(result.wallet.balance).toBe(2500);
  });

  it("returns active subscription with plan details", async () => {
    setupFromSequence([
      chainBuilder({
        plan_id: "team_pro",
        plan_code: "team_pro",
        status: "active",
        current_period_start: "2025-01-01T00:00:00Z",
        current_period_end: "2025-02-01T00:00:00Z",
        provider: "manual",
        provider_ref: null,
      }),
      chainBuilder({
        code: "team_pro",
        name: "Team Pro",
        type: "team",
        monthly_price_idr: 500000,
        seat_limit: 10,
        meta: {},
        is_active: true,
      }),
      chainBuilder([
        { code: "free_locked", name: "Free", type: null, monthly_price_idr: 0, seat_limit: 1, meta: {}, is_active: true },
        { code: "team_pro", name: "Team Pro", type: "team", monthly_price_idr: 500000, seat_limit: 10, meta: {}, is_active: true },
      ]),
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.subscription).not.toBeNull();
    expect(result.subscription?.plan_code).toBe("team_pro");
    expect(result.subscription?.status).toBe("active");
    expect(result.statusLabel).toBe("Active");
    expect(result.plan?.name).toBe("Team Pro");
    expect(result.plan?.seat_limit).toBe(10);
  });

  it("maps trialing status correctly", async () => {
    setupFromSequence([
      chainBuilder({
        plan_id: "ind_starter",
        plan_code: "ind_starter",
        status: "trialing",
        current_period_start: null,
        current_period_end: null,
        provider: "manual",
        provider_ref: null,
      }),
      chainBuilder({ code: "ind_starter", name: "Starter", type: null, monthly_price_idr: 0, seat_limit: 1, meta: {}, is_active: true }),
      chainBuilder([]),
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.statusLabel).toBe("Trial");
  });

  it("maps past_due status correctly", async () => {
    setupFromSequence([
      chainBuilder({
        plan_id: "team_pro",
        plan_code: "team_pro",
        status: "past_due",
        current_period_start: null,
        current_period_end: null,
        provider: "stripe",
        provider_ref: "sub_123",
      }),
      chainBuilder(null),
      chainBuilder([]),
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.statusLabel).toBe("Past due");
  });

  it("maps canceled status correctly", async () => {
    setupFromSequence([
      chainBuilder({
        plan_id: "team_pro",
        plan_code: "team_pro",
        status: "canceled",
        current_period_start: null,
        current_period_end: null,
        provider: "manual",
        provider_ref: null,
      }),
      chainBuilder(null),
      chainBuilder([]),
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.statusLabel).toBe("Canceled");
  });

  it("returns period not available when no dates", async () => {
    setupFromSequence([
      chainBuilder({
        plan_id: "free_locked",
        plan_code: "free_locked",
        status: "active",
        current_period_start: null,
        current_period_end: null,
        provider: null,
        provider_ref: null,
      }),
      chainBuilder(null),
      chainBuilder([]),
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.periodLabel).toBe("Period not available yet");
  });

  it("computes usage metrics correctly", async () => {
    // Override the token mocks for this test
    const { getTokenSettings, getTokenUsage } = await import("@/lib/tokens");
    vi.mocked(getTokenSettings).mockResolvedValueOnce({
      monthly_cap: 10000,
      alert_threshold: 80,
      hard_cap: false,
      updated_at: null,
    });
    vi.mocked(getTokenUsage).mockResolvedValueOnce({
      used: 7500,
      dailyUsage: [],
      yyyymm: "202501",
      periodStart: "2025-01-01T00:00:00.000Z",
      periodEnd: "2025-02-01T00:00:00.000Z",
    });

    setupFromSequence([
      chainBuilder(null), // subscription
      chainBuilder(null), // plan
      chainBuilder([]),   // plans
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.usage.cap).toBe(10000);
    expect(result.usage.used).toBe(7500);
    expect(result.usage.remaining).toBe(2500);
    expect(result.usage.percentUsed).toBe(75);
  });

  it("returns null cap and remaining when no monthly cap set", async () => {
    setupFromSequence([
      chainBuilder(null),
      chainBuilder(null),
      chainBuilder([]),
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.usage.cap).toBeNull();
    expect(result.usage.remaining).toBeNull();
    expect(result.usage.percentUsed).toBeNull();
  });

  it("includes all plans in summary", async () => {
    const allPlans = [
      { code: "free_locked", name: "Free", type: null, monthly_price_idr: 0, seat_limit: 1, meta: {} },
      { code: "ind_starter", name: "Starter", type: null, monthly_price_idr: 99000, seat_limit: 1, meta: {} },
      { code: "team_pro", name: "Team Pro", type: "team", monthly_price_idr: 500000, seat_limit: 10, meta: {} },
    ];

    setupFromSequence([
      chainBuilder(null),
      chainBuilder(null),
      chainBuilder(allPlans),
    ]);

    const result = await getBillingSummary("ws_test");
    expect(result.plans.length).toBe(3);
    expect(result.plans[0].code).toBe("free_locked");
  });
});
