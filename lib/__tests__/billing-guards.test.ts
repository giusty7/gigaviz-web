/**
 * Tests for lib/billing/guards.ts
 *
 * Tests assertEntitlement and assertTokenBudget with various scenarios:
 * sufficient/insufficient tokens, cap exceeded, no cap, feature allowed/denied.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("server-only", () => ({}));

const { mockGetWorkspaceEntitlements } = vi.hoisted(() => ({
  mockGetWorkspaceEntitlements: vi.fn(),
}));

vi.mock("@/lib/entitlements/server", () => ({
  getWorkspaceEntitlements: mockGetWorkspaceEntitlements,
}));

const { mockGetWallet, mockGetTokenSettings, mockGetTokenUsage } = vi.hoisted(() => ({
  mockGetWallet: vi.fn(),
  mockGetTokenSettings: vi.fn(),
  mockGetTokenUsage: vi.fn(),
}));

vi.mock("@/lib/tokens", () => ({
  getWallet: mockGetWallet,
  getTokenSettings: mockGetTokenSettings,
  getTokenUsage: mockGetTokenUsage,
}));

// ─── Import after mocks ────────────────────────────────────────────
import { assertEntitlement, assertTokenBudget } from "../billing/guards";

// ─── Tests ──────────────────────────────────────────────────────────

describe("assertEntitlement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns allowed=true when feature is granted", async () => {
    mockGetWorkspaceEntitlements.mockResolvedValue({
      features: { meta_hub: true, studio: true, helper: false },
    });

    const result = await assertEntitlement("ws_123", "meta_hub");
    expect(result.allowed).toBe(true);
  });

  it("returns allowed=false when feature is not granted", async () => {
    mockGetWorkspaceEntitlements.mockResolvedValue({
      features: { meta_hub: true, helper: false },
    });

    const result = await assertEntitlement("ws_123", "helper");
    expect(result.allowed).toBe(false);
  });

  it("returns allowed=false when feature key does not exist", async () => {
    mockGetWorkspaceEntitlements.mockResolvedValue({
      features: {},
    });

    const result = await assertEntitlement("ws_123", "marketplace");
    expect(result.allowed).toBe(false);
  });

  it("includes full entitlements object in result", async () => {
    const entitlements = {
      features: { meta_hub: true, studio: true },
      plan_id: "growth",
    };
    mockGetWorkspaceEntitlements.mockResolvedValue(entitlements);

    const result = await assertEntitlement("ws_123", "meta_hub");
    expect(result.entitlements).toEqual(entitlements);
  });
});

describe("assertTokenBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns allowed=true when balance is sufficient and no cap", async () => {
    mockGetWallet.mockResolvedValue({ balance_bigint: 10000 });
    mockGetTokenSettings.mockResolvedValue({ monthly_cap: null });
    mockGetTokenUsage.mockResolvedValue({ used: 500 });

    const result = await assertTokenBudget("ws_123", 100);
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.balance).toBe(10000);
      expect(result.cap).toBeNull();
      expect(result.used).toBe(500);
    }
  });

  it("returns allowed=false with insufficient_tokens reason", async () => {
    mockGetWallet.mockResolvedValue({ balance_bigint: 50 });
    mockGetTokenSettings.mockResolvedValue({ monthly_cap: null });
    mockGetTokenUsage.mockResolvedValue({ used: 0 });

    const result = await assertTokenBudget("ws_123", 100);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("insufficient_tokens");
      expect(result.balance).toBe(50);
    }
  });

  it("returns allowed=false with cap_exceeded reason", async () => {
    mockGetWallet.mockResolvedValue({ balance_bigint: 100000 });
    mockGetTokenSettings.mockResolvedValue({ monthly_cap: 1000 });
    mockGetTokenUsage.mockResolvedValue({ used: 950 });

    const result = await assertTokenBudget("ws_123", 100);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("cap_exceeded");
      expect(result.cap).toBe(1000);
      expect(result.used).toBe(950);
    }
  });

  it("allows when usage + cost equals cap exactly", async () => {
    mockGetWallet.mockResolvedValue({ balance_bigint: 100000 });
    mockGetTokenSettings.mockResolvedValue({ monthly_cap: 1000 });
    mockGetTokenUsage.mockResolvedValue({ used: 900 });

    const result = await assertTokenBudget("ws_123", 100);
    expect(result.allowed).toBe(true);
  });

  it("treats zero/negative cap as no cap", async () => {
    mockGetWallet.mockResolvedValue({ balance_bigint: 1000 });
    mockGetTokenSettings.mockResolvedValue({ monthly_cap: 0 });
    mockGetTokenUsage.mockResolvedValue({ used: 99999 });

    const result = await assertTokenBudget("ws_123", 100);
    expect(result.allowed).toBe(true); // No cap enforcement when cap is 0
    if (result.allowed) {
      expect(result.cap).toBeNull();
    }
  });

  it("treats NaN/Infinity cap as no cap", async () => {
    mockGetWallet.mockResolvedValue({ balance_bigint: 1000 });
    mockGetTokenSettings.mockResolvedValue({ monthly_cap: Infinity });
    mockGetTokenUsage.mockResolvedValue({ used: 0 });

    const result = await assertTokenBudget("ws_123", 100);
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.cap).toBeNull();
    }
  });

  it("handles zero balance correctly", async () => {
    mockGetWallet.mockResolvedValue({ balance_bigint: 0 });
    mockGetTokenSettings.mockResolvedValue({ monthly_cap: null });
    mockGetTokenUsage.mockResolvedValue({ used: 0 });

    const result = await assertTokenBudget("ws_123", 1);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("insufficient_tokens");
    }
  });

  it("handles null balance_bigint gracefully", async () => {
    mockGetWallet.mockResolvedValue({ balance_bigint: null });
    mockGetTokenSettings.mockResolvedValue({ monthly_cap: null });
    mockGetTokenUsage.mockResolvedValue({ used: 0 });

    const result = await assertTokenBudget("ws_123", 1);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("insufficient_tokens");
      expect(result.balance).toBe(0);
    }
  });
});
