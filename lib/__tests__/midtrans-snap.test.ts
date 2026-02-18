/**
 * Tests for lib/midtrans/snap.ts
 *
 * Tests plan pricing, token packages, and Snap transaction creation helpers.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("server-only", () => ({}));

const { mockSnapCreateTransaction } = vi.hoisted(() => ({
  mockSnapCreateTransaction: vi.fn(),
}));

vi.mock("@/lib/midtrans/client", () => ({
  snapCreateTransaction: mockSnapCreateTransaction,
}));

const mockDbFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: mockDbFrom }),
}));

vi.mock("@/lib/logging", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ─── Import after mocks ────────────────────────────────────────────
import {
  PLAN_PRICES,
  TOKEN_PACKAGES,
  createSubscriptionSnap,
  createTokenTopupSnap,
} from "../midtrans/snap";

// ─── Helpers ────────────────────────────────────────────────────────

function mockInsertSuccess(intentId = "intent_123") {
  const selectSingle = vi.fn().mockResolvedValue({
    data: { id: intentId },
    error: null,
  });
  const selectChain = vi.fn().mockReturnValue({ single: selectSingle });
  const insertChain = vi.fn().mockReturnValue({ select: selectChain });
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const updateChain = vi.fn().mockReturnValue({ eq: updateEq });

  mockDbFrom.mockImplementation((table: string) => {
    if (table === "payment_intents") {
      return { insert: insertChain, update: updateChain };
    }
    return {};
  });
}

function mockInsertFailure() {
  const selectSingle = vi.fn().mockResolvedValue({
    data: null,
    error: { message: "Insert failed" },
  });
  const selectChain = vi.fn().mockReturnValue({ single: selectSingle });
  const insertChain = vi.fn().mockReturnValue({ select: selectChain });

  mockDbFrom.mockImplementation(() => ({
    insert: insertChain,
  }));
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("PLAN_PRICES", () => {
  it("has starter, growth, business plans", () => {
    expect(PLAN_PRICES).toHaveProperty("starter");
    expect(PLAN_PRICES).toHaveProperty("growth");
    expect(PLAN_PRICES).toHaveProperty("business");
  });

  it("all plans have monthly and yearly prices", () => {
    for (const [code, plan] of Object.entries(PLAN_PRICES)) {
      expect(plan.monthly).toBeGreaterThan(0);
      expect(plan.yearly).toBeGreaterThan(plan.monthly);
      expect(plan.name).toBeTruthy();
      // Yearly should be less than 12x monthly (discount)
      expect(plan.yearly).toBeLessThan(plan.monthly * 12);
      expect(typeof code).toBe("string");
    }
  });

  it("starter is cheapest, business is most expensive", () => {
    expect(PLAN_PRICES.starter.monthly).toBeLessThan(PLAN_PRICES.growth.monthly);
    expect(PLAN_PRICES.growth.monthly).toBeLessThan(PLAN_PRICES.business.monthly);
  });
});

describe("TOKEN_PACKAGES", () => {
  it("has pkg_50k, pkg_100k, pkg_500k", () => {
    expect(TOKEN_PACKAGES).toHaveProperty("pkg_50k");
    expect(TOKEN_PACKAGES).toHaveProperty("pkg_100k");
    expect(TOKEN_PACKAGES).toHaveProperty("pkg_500k");
  });

  it("all packages have valid tokens and prices", () => {
    for (const [id, pkg] of Object.entries(TOKEN_PACKAGES)) {
      expect(pkg.tokens).toBeGreaterThan(0);
      expect(pkg.priceIdr).toBeGreaterThan(0);
      expect(pkg.label).toBeTruthy();
      expect(typeof id).toBe("string");
    }
  });

  it("larger packages have bonus tokens", () => {
    // pkg_100k gives 105k tokens for 100k IDR
    expect(TOKEN_PACKAGES.pkg_100k.tokens).toBeGreaterThan(TOKEN_PACKAGES.pkg_100k.priceIdr);
    // pkg_500k gives 550k tokens for 500k IDR
    expect(TOKEN_PACKAGES.pkg_500k.tokens).toBeGreaterThan(TOKEN_PACKAGES.pkg_500k.priceIdr);
  });

  it("pkg_50k has no bonus (1:1 ratio)", () => {
    expect(TOKEN_PACKAGES.pkg_50k.tokens).toBe(TOKEN_PACKAGES.pkg_50k.priceIdr);
  });
});

describe("createSubscriptionSnap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for invalid plan code", async () => {
    const result = await createSubscriptionSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      planCode: "nonexistent_plan",
      interval: "monthly",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_plan");
    }
  });

  it("returns error when DB insert fails", async () => {
    mockInsertFailure();

    const result = await createSubscriptionSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      planCode: "starter",
      interval: "monthly",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("db_error");
    }
  });

  it("creates subscription snap successfully", async () => {
    mockInsertSuccess("intent_sub_1");
    mockSnapCreateTransaction.mockResolvedValue({
      token: "snap-sub-token",
      redirect_url: "https://snap.midtrans.com/v1/pay",
    });

    const result = await createSubscriptionSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      planCode: "starter",
      interval: "monthly",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token).toBe("snap-sub-token");
      expect(result.redirectUrl).toContain("midtrans.com");
      expect(result.orderId).toContain("SUB-STARTER-NEW");
    }
  });

  it("uses yearly pricing for yearly interval", async () => {
    mockInsertSuccess();
    mockSnapCreateTransaction.mockResolvedValue({
      token: "snap-yearly-token",
      redirect_url: "https://snap.midtrans.com/v1/pay",
    });

    const result = await createSubscriptionSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      planCode: "growth",
      interval: "yearly",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(true);

    // Verify the Snap call used yearly pricing
    const snapCall = mockSnapCreateTransaction.mock.calls[0][0];
    expect(snapCall.transaction_details.gross_amount).toBe(PLAN_PRICES.growth.yearly);
  });

  it("tags renewals with RNW in order ID", async () => {
    mockInsertSuccess();
    mockSnapCreateTransaction.mockResolvedValue({
      token: "snap-renew",
      redirect_url: "https://snap.midtrans.com/v1/pay",
    });

    const result = await createSubscriptionSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      planCode: "business",
      interval: "monthly",
      customerEmail: "user@example.com",
      customerName: "Test User",
      isRenewal: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.orderId).toContain("RNW");
    }
  });

  it("returns midtrans_error when Snap API fails", async () => {
    mockInsertSuccess();
    mockSnapCreateTransaction.mockRejectedValue(new Error("Midtrans Snap error 500"));

    const result = await createSubscriptionSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      planCode: "starter",
      interval: "monthly",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("midtrans_error");
    }
  });
});

describe("createTokenTopupSnap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for invalid package ID", async () => {
    const result = await createTokenTopupSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      packageId: "pkg_nonexistent",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_package");
    }
  });

  it("returns error when DB insert fails", async () => {
    mockInsertFailure();

    const result = await createTokenTopupSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      packageId: "pkg_50k",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("db_error");
    }
  });

  it("creates topup snap for pkg_50k", async () => {
    mockInsertSuccess("intent_topup_1");
    mockSnapCreateTransaction.mockResolvedValue({
      token: "snap-topup-token",
      redirect_url: "https://snap.midtrans.com/v1/pay",
    });

    const result = await createTokenTopupSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      packageId: "pkg_50k",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token).toBe("snap-topup-token");
      expect(result.orderId).toContain("TOPUP");
    }

    // Verify amount matches pkg_50k
    const snapCall = mockSnapCreateTransaction.mock.calls[0][0];
    expect(snapCall.transaction_details.gross_amount).toBe(50_000);
  });

  it("creates topup snap for pkg_500k with correct amount", async () => {
    mockInsertSuccess();
    mockSnapCreateTransaction.mockResolvedValue({
      token: "snap-500k-token",
      redirect_url: "https://snap.midtrans.com/v1/pay",
    });

    const result = await createTokenTopupSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      packageId: "pkg_500k",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(true);

    const snapCall = mockSnapCreateTransaction.mock.calls[0][0];
    expect(snapCall.transaction_details.gross_amount).toBe(500_000);
  });

  it("returns midtrans_error when Snap API fails", async () => {
    mockInsertSuccess();
    mockSnapCreateTransaction.mockRejectedValue(new Error("Network timeout"));

    const result = await createTokenTopupSnap({
      workspaceId: "ws_123",
      workspaceSlug: "test-ws",
      packageId: "pkg_100k",
      customerEmail: "user@example.com",
      customerName: "Test User",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("midtrans_error");
    }
  });
});
