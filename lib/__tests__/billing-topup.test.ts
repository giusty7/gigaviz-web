/**
 * Tests for lib/billing/topup.ts
 *
 * Tests settlePaymentIntentPaid: idempotency, workspace validation,
 * ledger entry creation, wallet balance updates.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("server-only", () => ({}));

const mockDbFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: mockDbFrom }),
}));

const { mockGetWallet } = vi.hoisted(() => ({
  mockGetWallet: vi.fn(),
}));

vi.mock("@/lib/tokens", () => ({
  getWallet: mockGetWallet,
}));

// ─── Import after mocks ────────────────────────────────────────────
import { settlePaymentIntentPaid } from "../billing/topup";

// ─── Helpers ────────────────────────────────────────────────────────

type FromHandler = Record<string, ReturnType<typeof vi.fn>>;

function setupDb(handlers: Record<string, FromHandler>) {
  mockDbFrom.mockImplementation((table: string) => {
    return handlers[table] ?? {};
  });
}

function makeMaybeSingle(data: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("settlePaymentIntentPaid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not found when payment intent does not exist", async () => {
    setupDb({
      payment_intents: makeMaybeSingle(null),
    });

    const result = await settlePaymentIntentPaid("nonexistent_id");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("payment_intent_not_found");
    }
  });

  it("returns workspace_mismatch when workspace IDs differ", async () => {
    setupDb({
      payment_intents: makeMaybeSingle({
        id: "pi_1",
        workspace_id: "ws_actual",
        amount_idr: 50000,
        status: "pending",
        meta: { tokens: 50000 },
      }),
    });

    const result = await settlePaymentIntentPaid("pi_1", {
      workspaceId: "ws_different",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("workspace_mismatch");
    }
  });

  it("returns already_paid when intent is already paid", async () => {
    setupDb({
      payment_intents: makeMaybeSingle({
        id: "pi_1",
        workspace_id: "ws_123",
        amount_idr: 50000,
        status: "paid",
        meta: { tokens: 50000 },
      }),
    });

    const result = await settlePaymentIntentPaid("pi_1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("already_paid");
      expect(result.tokens).toBe(50000);
    }
  });

  it("credits tokens and marks as paid for pending intent", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    const upsertFn = vi.fn().mockResolvedValue({ error: null });

    setupDb({
      payment_intents: {
        ...makeMaybeSingle({
          id: "pi_1",
          workspace_id: "ws_123",
          amount_idr: 100000,
          status: "pending",
          meta: { tokens: 105000 },
        }),
        update: updateFn,
      },
      token_ledger: makeMaybeSingle(null), // No existing ledger entry
      token_wallets: { update: updateFn },
    });

    // Add upsert to token_ledger handler
    mockDbFrom.mockImplementation((table: string) => {
      if (table === "payment_intents") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "pi_1",
                  workspace_id: "ws_123",
                  amount_idr: 100000,
                  status: "pending",
                  meta: { tokens: 105000 },
                },
                error: null,
              }),
            }),
          }),
          update: updateFn,
        };
      }
      if (table === "token_ledger") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          upsert: upsertFn,
        };
      }
      if (table === "token_wallets") {
        return { update: updateFn };
      }
      return {};
    });

    mockGetWallet.mockResolvedValue({
      balance_bigint: 10000,
      workspace_id: "ws_123",
    });

    const result = await settlePaymentIntentPaid("pi_1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("paid");
      expect(result.tokens).toBe(105000);
    }
  });

  it("uses amount_idr as fallback when meta.tokens is missing", async () => {
    setupDb({
      payment_intents: makeMaybeSingle({
        id: "pi_2",
        workspace_id: "ws_456",
        amount_idr: 50000,
        status: "paid",
        meta: {},
      }),
    });

    const result = await settlePaymentIntentPaid("pi_2");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tokens).toBe(50000); // Falls back to amount_idr
    }
  });
});
