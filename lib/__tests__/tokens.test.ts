/**
 * Tests for lib/tokens/index.ts
 *
 * Tests token wallet, ledger, settings, usage, overview, and consume/topup flows.
 * Uses mock Supabase to avoid real DB calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only before importing the module
vi.mock("server-only", () => ({}));

// Mock supabase admin
const mockFrom = vi.fn();
const mockRpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

// Import after mocks
import {
  getTokenSettings,
  upsertTokenSettings,
  getTokenUsage,
  getTokenOverview,
  getWallet,
  listTokenLedger,
  getLedger,
  requireTokens,
  consumeTokens,
  createTopupRequest,
  tokenActionFeatureMap,
} from "../tokens";

// ─── Helpers ────────────────────────────────────────────────────────

function chainBuilder(resolveData: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolveData, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolveData, error }),
  };
  return builder;
}

// Track call order for "from" calls
let fromCallIndex = 0;
let fromHandlers: Array<ReturnType<typeof chainBuilder>> = [];

function setupFromSequence(handlers: Array<ReturnType<typeof chainBuilder>>) {
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

// ─── tokenActionFeatureMap ──────────────────────────────────────────

describe("tokenActionFeatureMap", () => {
  it("maps all token actions to feature keys", () => {
    expect(tokenActionFeatureMap.helper_chat).toBe("helper");
    expect(tokenActionFeatureMap.meta_send_message).toBe("meta_send");
    expect(tokenActionFeatureMap.mass_blast_send).toBe("mass_blast");
    expect(tokenActionFeatureMap.graph_generate_image).toBe("graph");
    expect(tokenActionFeatureMap.tracks_generate).toBe("tracks");
    expect(tokenActionFeatureMap.office_export).toBe("office");
  });
});

// ─── getTokenSettings ───────────────────────────────────────────────

describe("getTokenSettings", () => {
  it("returns settings from token_settings table when found", async () => {
    const settingsRow = {
      monthly_cap: 10000,
      alert_threshold: 70,
      hard_cap: true,
      updated_at: "2025-01-01T00:00:00Z",
    };
    setupFromSequence([chainBuilder(settingsRow)]);

    const result = await getTokenSettings("ws_123");
    expect(result.monthly_cap).toBe(10000);
    expect(result.alert_threshold).toBe(70);
    expect(result.hard_cap).toBe(true);
    expect(result.updated_at).toBe("2025-01-01T00:00:00Z");
  });

  it("falls back to token_wallets when token_settings not found", async () => {
    const walletRow = { monthly_cap: 5000, updated_at: "2025-02-01T00:00:00Z" };
    setupFromSequence([
      chainBuilder(null), // token_settings → not found
      chainBuilder(walletRow), // token_wallets → found
    ]);

    const result = await getTokenSettings("ws_123");
    expect(result.monthly_cap).toBe(5000);
    expect(result.alert_threshold).toBe(80); // default
    expect(result.hard_cap).toBe(false); // default
    expect(result.updated_at).toBe("2025-02-01T00:00:00Z");
  });

  it("normalizes invalid cap values to null", async () => {
    const settingsRow = { monthly_cap: -100, alert_threshold: 80, hard_cap: false, updated_at: null };
    setupFromSequence([chainBuilder(settingsRow)]);

    const result = await getTokenSettings("ws_123");
    expect(result.monthly_cap).toBeNull();
  });

  it("normalizes Infinity cap to null", async () => {
    const settingsRow = { monthly_cap: Infinity, alert_threshold: 80, hard_cap: false, updated_at: null };
    setupFromSequence([chainBuilder(settingsRow)]);

    const result = await getTokenSettings("ws_123");
    expect(result.monthly_cap).toBeNull();
  });

  it("returns defaults when both tables return null", async () => {
    setupFromSequence([
      chainBuilder(null), // token_settings → not found
      chainBuilder(null), // token_wallets → not found
    ]);

    const result = await getTokenSettings("ws_123");
    expect(result.monthly_cap).toBeNull();
    expect(result.alert_threshold).toBe(80);
    expect(result.hard_cap).toBe(false);
    expect(result.updated_at).toBeNull();
  });
});

// ─── upsertTokenSettings ───────────────────────────────────────────

describe("upsertTokenSettings", () => {
  it("upserts settings and updates wallet", async () => {
    const upsertBuilder = chainBuilder(null);
    (upsertBuilder.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
    const updateBuilder = chainBuilder(null);
    (updateBuilder.update as ReturnType<typeof vi.fn>).mockReturnValue(updateBuilder);

    setupFromSequence([upsertBuilder, updateBuilder]);

    const result = await upsertTokenSettings("ws_123", {
      monthly_cap: 10000,
      alert_threshold: 90,
      hard_cap: true,
    });

    expect(result.monthly_cap).toBe(10000);
    expect(result.alert_threshold).toBe(90);
    expect(result.hard_cap).toBe(true);
  });

  it("uses defaults when partial input provided", async () => {
    const upsertBuilder = chainBuilder(null);
    (upsertBuilder.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
    const updateBuilder = chainBuilder(null);
    (updateBuilder.update as ReturnType<typeof vi.fn>).mockReturnValue(updateBuilder);

    setupFromSequence([upsertBuilder, updateBuilder]);

    const result = await upsertTokenSettings("ws_123", {});
    expect(result.monthly_cap).toBeNull();
    expect(result.alert_threshold).toBe(80);
    expect(result.hard_cap).toBe(false);
  });

  it("throws if upsert fails", async () => {
    const upsertBuilder = chainBuilder(null);
    (upsertBuilder.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: { code: "23505", message: "Unique constraint" },
    });

    setupFromSequence([upsertBuilder]);

    await expect(upsertTokenSettings("ws_123", {})).rejects.toBeDefined();
  });
});

// ─── getTokenUsage ──────────────────────────────────────────────────

describe("getTokenUsage", () => {
  it("calculates usage from ledger rows", async () => {
    const rows = [
      { tokens: -50, delta_bigint: -50, entry_type: "spend", status: "posted", created_at: "2025-01-15T12:00:00Z" },
      { tokens: -30, delta_bigint: -30, entry_type: "spend", status: "posted", created_at: "2025-01-15T14:00:00Z" },
      { tokens: -20, delta_bigint: -20, entry_type: "spend", status: "posted", created_at: "2025-01-16T09:00:00Z" },
    ];
    const builder = chainBuilder(rows);
    // Override "then" behavior to return array (the chain resolves via range→implicit resolve)
    (builder.range as ReturnType<typeof vi.fn>).mockReturnValue({
      ...builder,
      then: (fn: (v: { data: unknown[] }) => void) => fn({ data: rows }),
    });
    // Since getTokenUsage doesn't use .range, we need to return via the final chain call
    // The function chains: select→eq(4 times)→gte→lt → implicit resolution
    // Let's mock `lt` to resolve
    (builder.lt as ReturnType<typeof vi.fn>).mockResolvedValue({ data: rows, error: null });

    setupFromSequence([builder]);

    const result = await getTokenUsage("ws_123", "202501");
    expect(result.used).toBe(100);
    expect(result.yyyymm).toBe("202501");
    expect(result.dailyUsage.length).toBeGreaterThanOrEqual(1);
  });

  it("returns zero usage for empty ledger", async () => {
    const builder = chainBuilder([]);
    (builder.lt as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });

    setupFromSequence([builder]);

    const result = await getTokenUsage("ws_123");
    expect(result.used).toBe(0);
    expect(result.dailyUsage).toEqual([]);
  });

  it("handles null yyyymm (defaults to current month)", async () => {
    const builder = chainBuilder([]);
    (builder.lt as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });

    setupFromSequence([builder]);

    const now = new Date();
    const expected = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const result = await getTokenUsage("ws_123", null);
    expect(result.yyyymm).toBe(expected);
  });
});

// ─── getWallet ──────────────────────────────────────────────────────

describe("getWallet", () => {
  it("returns existing wallet", async () => {
    const walletData = { workspace_id: "ws_123", balance_bigint: 5000, updated_at: "2025-01-01T00:00:00Z" };
    setupFromSequence([chainBuilder(walletData)]);

    const result = await getWallet("ws_123");
    expect(result.balance_bigint).toBe(5000);
    expect(result.workspace_id).toBe("ws_123");
  });

  it("creates wallet if not found", async () => {
    const created = { workspace_id: "ws_new", balance_bigint: 0, updated_at: null };
    const selectBuilder = chainBuilder(null); // First query: not found
    const insertBuilder = chainBuilder(created); // Second query: created

    setupFromSequence([selectBuilder, insertBuilder]);

    const result = await getWallet("ws_new");
    expect(result.workspace_id).toBe("ws_new");
    expect(result.balance_bigint).toBe(0);
  });

  it("throws on query error", async () => {
    const builder = chainBuilder(null, { code: "500", message: "DB error" });
    setupFromSequence([builder]);

    await expect(getWallet("ws_123")).rejects.toBeDefined();
  });
});

// ─── listTokenLedger ────────────────────────────────────────────────

describe("listTokenLedger", () => {
  it("returns paginated ledger rows", async () => {
    const rows = [
      { id: "r1", workspace_id: "ws_123", tokens: 100, delta_bigint: 100, entry_type: "topup", status: "posted", reason: "topup", feature_key: null, ref_type: null, ref_id: null, ref_table: null, note: null, meta: null, created_by: null, user_id: null, created_at: "2025-01-01T00:00:00Z" },
    ];
    const builder = chainBuilder(rows);
    (builder.range as ReturnType<typeof vi.fn>).mockReturnValue({
      ...builder,
      then: (fn: (v: { data: unknown[]; count: number }) => void) => fn({ data: rows, count: 1 }),
    });
    // The actual chain ends with order→range which resolves
    (builder.order as ReturnType<typeof vi.fn>).mockReturnValue(builder);
    (builder.range as ReturnType<typeof vi.fn>).mockResolvedValue({ data: rows, error: null, count: 1 });

    setupFromSequence([builder]);

    const result = await listTokenLedger("ws_123", { page: 1, pageSize: 20 });
    expect(result.rows).toHaveLength(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(1);
  });

  it("enforces pageSize bounds (min 1, max 200)", async () => {
    const builder = chainBuilder([]);
    (builder.order as ReturnType<typeof vi.fn>).mockReturnValue(builder);
    (builder.range as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null, count: 0 });

    setupFromSequence([builder]);

    const result = await listTokenLedger("ws_123", { pageSize: 999 });
    expect(result.pageSize).toBe(200);
  });

  it("enforces minimum page of 1", async () => {
    const builder = chainBuilder([]);
    (builder.order as ReturnType<typeof vi.fn>).mockReturnValue(builder);
    (builder.range as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null, count: 0 });

    setupFromSequence([builder]);

    const result = await listTokenLedger("ws_123", { page: -5 });
    expect(result.page).toBe(1);
  });
});

// ─── getLedger ───────────────────────────────────────────────────────

describe("getLedger", () => {
  it("delegates to listTokenLedger and returns rows only", async () => {
    const rows = [{ id: "r1" }];
    const builder = chainBuilder([]);
    (builder.order as ReturnType<typeof vi.fn>).mockReturnValue(builder);
    (builder.range as ReturnType<typeof vi.fn>).mockResolvedValue({ data: rows, error: null, count: 1 });

    setupFromSequence([builder]);

    const result = await getLedger("ws_123");
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── requireTokens ──────────────────────────────────────────────────

describe("requireTokens", () => {
  it("returns wallet when balance is sufficient", async () => {
    const walletData = { workspace_id: "ws_123", balance_bigint: 5000, updated_at: null };
    setupFromSequence([chainBuilder(walletData)]);

    const result = await requireTokens("ws_123", 100);
    expect(result.balance_bigint).toBe(5000);
  });

  it("throws 'insufficient_tokens' when balance too low", async () => {
    const walletData = { workspace_id: "ws_123", balance_bigint: 5, updated_at: null };
    setupFromSequence([chainBuilder(walletData)]);

    await expect(requireTokens("ws_123", 100)).rejects.toThrow("insufficient_tokens");
  });

  it("attaches metadata to error", async () => {
    const walletData = { workspace_id: "ws_123", balance_bigint: 0, updated_at: null };
    setupFromSequence([chainBuilder(walletData)]);

    const metadata = { feature_key: "helper", ref_id: "ref_123" };
    try {
      await requireTokens("ws_123", 100, metadata);
      expect.fail("Should have thrown");
    } catch (err) {
      expect((err as Error & { metadata?: unknown }).metadata).toEqual(metadata);
    }
  });
});

// ─── consumeTokens ──────────────────────────────────────────────────

describe("consumeTokens", () => {
  it("calls RPC consume_tokens and returns result", async () => {
    mockRpc.mockResolvedValue({ data: { new_balance: 4900 }, error: null });

    // Mock the dynamic import for quotas (best effort)
    vi.mock("@/lib/quotas", () => ({
      incrementQuotaUsage: vi.fn().mockResolvedValue(undefined),
      recordMetric: vi.fn().mockResolvedValue(undefined),
    }));

    const result = await consumeTokens("ws_123", 100, { feature_key: "helper" });
    expect(result).toEqual({ new_balance: 4900 });
    expect(mockRpc).toHaveBeenCalledWith("consume_tokens", expect.objectContaining({
      p_workspace_id: "ws_123",
      p_cost: 100,
      p_feature_key: "helper",
    }));
  });

  it("throws if RPC fails", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: "500", message: "RPC error" } });

    await expect(consumeTokens("ws_123", 100)).rejects.toBeDefined();
  });
});

// ─── createTopupRequest ─────────────────────────────────────────────

describe("createTopupRequest", () => {
  it("creates topup request and ledger entry", async () => {
    const requestRow = {
      id: "req_1",
      workspace_id: "ws_123",
      user_id: "user_1",
      package_key: "basic",
      tokens: 1000,
      notes: null,
      status: "pending",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: null,
    };

    const insertBuilder1 = chainBuilder(requestRow);
    const insertBuilder2 = chainBuilder(null);
    (insertBuilder2.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });

    setupFromSequence([insertBuilder1, insertBuilder2]);

    const result = await createTopupRequest({
      workspaceId: "ws_123",
      userId: "user_1",
      packageKey: "basic",
      tokens: 1000,
    });

    expect(result.id).toBe("req_1");
    expect(result.tokens).toBe(1000);
    expect(result.status).toBe("pending");
  });
});

// ─── getTokenOverview ───────────────────────────────────────────────

describe("getTokenOverview", () => {
  it("returns overview with normal status when no cap", async () => {
    // getTokenSettings → token_settings (null) → token_wallets (null)
    // getTokenUsage → token_ledger (empty)
    // getWallet → token_wallets (exists)
    const walletData = { workspace_id: "ws_123", balance_bigint: 5000, updated_at: null, monthly_cap: null };

    setupFromSequence([
      chainBuilder(null),   // getTokenSettings → token_settings
      chainBuilder(walletData), // getTokenSettings → token_wallets fallback
      // getTokenUsage:
      (() => {
        const b = chainBuilder([]);
        (b.lt as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });
        return b;
      })(),
      chainBuilder(walletData), // getWallet
    ]);

    const result = await getTokenOverview("ws_123");
    expect(result.balance).toBe(5000);
    expect(result.cap).toBeNull();
    expect(result.status).toBe("normal");
    expect(result.used).toBe(0);
  });

  it("returns critical status when usage exceeds cap", async () => {
    const settingsRow = { monthly_cap: 100, alert_threshold: 80, hard_cap: true, updated_at: null };
    const usageRows = [
      { tokens: -120, delta_bigint: -120, entry_type: "spend", status: "posted", created_at: "2025-01-15T12:00:00Z" },
    ];
    const walletData = { workspace_id: "ws_123", balance_bigint: 0, updated_at: null };

    setupFromSequence([
      chainBuilder(settingsRow), // getTokenSettings → token_settings
      // getTokenUsage:
      (() => {
        const b = chainBuilder(usageRows);
        (b.lt as ReturnType<typeof vi.fn>).mockResolvedValue({ data: usageRows, error: null });
        return b;
      })(),
      chainBuilder(walletData), // getWallet
    ]);

    const result = await getTokenOverview("ws_123");
    expect(result.status).toBe("critical");
    expect(result.percentUsed).toBeGreaterThanOrEqual(100);
  });

  it("returns warning status when usage is above threshold", async () => {
    const settingsRow = { monthly_cap: 100, alert_threshold: 80, hard_cap: false, updated_at: null };
    const usageRows = [
      { tokens: -85, delta_bigint: -85, entry_type: "spend", status: "posted", created_at: "2025-01-15T12:00:00Z" },
    ];
    const walletData = { workspace_id: "ws_123", balance_bigint: 15, updated_at: null };

    setupFromSequence([
      chainBuilder(settingsRow),
      (() => {
        const b = chainBuilder(usageRows);
        (b.lt as ReturnType<typeof vi.fn>).mockResolvedValue({ data: usageRows, error: null });
        return b;
      })(),
      chainBuilder(walletData),
    ]);

    const result = await getTokenOverview("ws_123");
    expect(result.status).toBe("warning");
    expect(result.percentUsed).toBeGreaterThanOrEqual(80);
    expect(result.percentUsed).toBeLessThan(100);
  });
});
