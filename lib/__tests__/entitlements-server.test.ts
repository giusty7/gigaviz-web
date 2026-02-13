/**
 * Tests for lib/entitlements/server.ts
 *
 * Tests workspace entitlement resolution with plan + override merging.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));

// Mock supabase admin
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

import { getWorkspaceEntitlements, requireEntitlement } from "../entitlements/server";

// ─── Helpers ────────────────────────────────────────────────────────

function chainBuilder(resolveData: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolveData, error }),
  };
  return builder;
}

function chainBuilderArray(resolveData: unknown[], error: unknown = null) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    // Array result (no .maybeSingle)
    then: vi.fn((fn: (v: { data: unknown[]; error: unknown }) => void) =>
      fn({ data: resolveData, error })
    ),
  };
  // Make it thenable (for await)
  Object.defineProperty(builder, "then", {
    value: (resolve: (v: { data: unknown[]; error: unknown }) => void) =>
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

// ─── getWorkspaceEntitlements ───────────────────────────────────────

describe("getWorkspaceEntitlements", () => {
  it("returns free when no subscription found", async () => {
    // subscriptions → null, workspace_entitlements → empty array
    setupFromSequence([
      chainBuilder(null), // subscriptions
      chainBuilderArray([]), // workspace_entitlements
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.planId).toBe("free");
    expect(typeof result.features).toBe("object");
  });

  it("resolves plan features for active subscription", async () => {
    setupFromSequence([
      chainBuilder({ plan_id: "team_pro" }), // subscriptions
      chainBuilderArray([]), // workspace_entitlements (no overrides)
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.planId).toBe("team_pro");
    // team_pro should have lots of features enabled (see lib/entitlements.ts planFeatures)
    expect(result.features.meta_hub).toBe(true);
    expect(result.features.helper).toBe(true);
    expect(result.features.analytics).toBe(true);
  });

  it("applies enabled entitlement overrides", async () => {
    setupFromSequence([
      chainBuilder({ plan_id: "free_locked" }), // subscriptions (free plan)
      chainBuilderArray([
        { key: "meta_hub", enabled: true, payload: {}, expires_at: null },
        { key: "helper", enabled: true, payload: { limit: 100 }, expires_at: null },
      ]),
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.planId).toBe("free_locked");
    // These should be overridden to true even on free plan
    expect(result.features.meta_hub).toBe(true);
    expect(result.features.helper).toBe(true);
  });

  it("ignores disabled overrides", async () => {
    setupFromSequence([
      chainBuilder({ plan_id: "free_locked" }),
      chainBuilderArray([
        { key: "meta_hub", enabled: false, payload: {}, expires_at: null },
      ]),
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.features.meta_hub).toBe(false);
  });

  it("ignores expired overrides", async () => {
    const pastDate = new Date(Date.now() - 86400_000).toISOString(); // 1 day ago

    setupFromSequence([
      chainBuilder({ plan_id: "free_locked" }),
      chainBuilderArray([
        { key: "meta_hub", enabled: true, payload: {}, expires_at: pastDate },
      ]),
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.features.meta_hub).toBe(false);
  });

  it("applies non-expired overrides", async () => {
    const futureDate = new Date(Date.now() + 86400_000).toISOString(); // 1 day from now

    setupFromSequence([
      chainBuilder({ plan_id: "free_locked" }),
      chainBuilderArray([
        { key: "meta_hub", enabled: true, payload: { premium: true }, expires_at: futureDate },
      ]),
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.features.meta_hub).toBe(true);
    expect(result.payloads.meta_hub).toEqual({ premium: true });
  });

  it("stores non-feature keys in limits", async () => {
    setupFromSequence([
      chainBuilder({ plan_id: "free_locked" }),
      chainBuilderArray([
        { key: "custom_quota_limit", enabled: true, payload: { max: 500 }, expires_at: null },
      ]),
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.limits.custom_quota_limit).toEqual({ max: 500 });
  });

  it("handles unknown plan_id gracefully (falls back to free)", async () => {
    setupFromSequence([
      chainBuilder({ plan_id: "nonexistent_plan_xyz" }),
      chainBuilderArray([]),
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.planId).toBe("free");
  });

  it("falls back to legacy query when overrides query errors", async () => {
    // First call: subscriptions → found
    // Second call: workspace_entitlements → error, triggers legacy path
    // Third call: workspace_entitlements legacy select → returns data
    setupFromSequence([
      chainBuilder({ plan_id: "free_locked" }),
      chainBuilderArray([], { code: "42703", message: "column does not exist" }),
      chainBuilderArray([
        { key: "meta_hub", value: true },
        { key: "helper", value: false },
      ]),
    ]);

    const result = await getWorkspaceEntitlements("ws_123");
    expect(result.features.meta_hub).toBe(true);
    expect(result.features.helper).toBe(false);
  });
});

// ─── requireEntitlement ─────────────────────────────────────────────

describe("requireEntitlement", () => {
  it("returns allowed: true when feature is enabled", async () => {
    setupFromSequence([
      chainBuilder({ plan_id: "team_pro" }),
      chainBuilderArray([]),
    ]);

    const result = await requireEntitlement("ws_123", "meta_hub");
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.entitlements.planId).toBe("team_pro");
    }
  });

  it("returns allowed: false when feature is not enabled", async () => {
    setupFromSequence([
      chainBuilder({ plan_id: "free_locked" }),
      chainBuilderArray([]),
    ]);

    const result = await requireEntitlement("ws_123", "meta_hub");
    expect(result.allowed).toBe(false);
  });
});
