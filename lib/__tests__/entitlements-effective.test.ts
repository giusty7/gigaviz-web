import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only (no-op)
vi.mock("server-only", () => ({}));

// Mock next/cache
vi.mock("next/cache", () => ({
  unstable_noStore: vi.fn(),
}));

// Mock supabaseAdmin
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: vi.fn(() => ({ from: mockFrom })),
}));

import { getWorkspaceEffectiveEntitlements } from "../entitlements/effective";

describe("getWorkspaceEffectiveEntitlements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockEntitlementRows(
    rows: Array<{ key: string; enabled: boolean; expires_at: string | null }>
  ) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    // Resolve the promise-like chain
    Object.defineProperty(chain, "then", {
      value: (resolve: (val: unknown) => void) =>
        resolve({ data: rows, error: null }),
      enumerable: false,
    });
    mockFrom.mockReturnValue(chain);
  }

  function mockError() {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    Object.defineProperty(chain, "then", {
      value: (resolve: (val: unknown) => void) =>
        resolve({ data: null, error: { code: "42P01", message: "table not found" } }),
      enumerable: false,
    });
    mockFrom.mockReturnValue(chain);
  }

  it("returns active entitlements for a workspace", async () => {
    mockEntitlementRows([
      { key: "meta_hub", enabled: true, expires_at: null },
      { key: "helper", enabled: true, expires_at: null },
      { key: "studio", enabled: true, expires_at: null },
    ]);

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    expect(result).toEqual(["meta_hub", "helper", "studio"]);
    expect(mockFrom).toHaveBeenCalledWith("workspace_entitlements");
  });

  it("filters out disabled entitlements", async () => {
    mockEntitlementRows([
      { key: "meta_hub", enabled: true, expires_at: null },
      { key: "helper", enabled: false, expires_at: null },
      { key: "studio", enabled: true, expires_at: null },
    ]);

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    expect(result).toEqual(["meta_hub", "studio"]);
    expect(result).not.toContain("helper");
  });

  it("filters out expired entitlements", async () => {
    const pastDate = new Date(Date.now() - 86_400_000).toISOString(); // yesterday
    const futureDate = new Date(Date.now() + 86_400_000).toISOString(); // tomorrow

    mockEntitlementRows([
      { key: "meta_hub", enabled: true, expires_at: pastDate },
      { key: "helper", enabled: true, expires_at: futureDate },
      { key: "studio", enabled: true, expires_at: null }, // no expiry = forever
    ]);

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    expect(result).toEqual(["helper", "studio"]);
    expect(result).not.toContain("meta_hub");
  });

  it("returns empty array on DB error", async () => {
    mockError();

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    expect(result).toEqual([]);
  });

  it("returns empty array when no entitlements exist", async () => {
    mockEntitlementRows([]);

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    expect(result).toEqual([]);
  });

  it("handles null data gracefully", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    Object.defineProperty(chain, "then", {
      value: (resolve: (val: unknown) => void) =>
        resolve({ data: null, error: null }),
      enumerable: false,
    });
    mockFrom.mockReturnValue(chain);

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    expect(result).toEqual([]);
  });

  it("handles entitlement with invalid expires_at date", async () => {
    mockEntitlementRows([
      { key: "meta_hub", enabled: true, expires_at: "invalid-date" },
      { key: "helper", enabled: true, expires_at: null },
    ]);

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    // invalid date → Number.isFinite check fails → should be filtered out
    expect(result).toContain("helper");
    expect(result).not.toContain("meta_hub");
  });

  it("includes entitlements expiring exactly in the future", async () => {
    const futureDate = new Date(Date.now() + 1000).toISOString(); // 1 second from now

    mockEntitlementRows([
      { key: "meta_hub", enabled: true, expires_at: futureDate },
    ]);

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    expect(result).toEqual(["meta_hub"]);
  });

  it("filters out rows with null key", async () => {
    mockEntitlementRows([
      { key: "meta_hub", enabled: true, expires_at: null },
      { key: null as unknown as string, enabled: true, expires_at: null },
    ]);

    const result = await getWorkspaceEffectiveEntitlements("ws_123");

    // null key should be filtered by typeof check
    expect(result).toEqual(["meta_hub"]);
  });
});
