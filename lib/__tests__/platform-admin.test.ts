/**
 * Tests for lib/platform-admin/server.ts
 *
 * Tests isOwnerEmailAllowed, isPlatformAdminById, and getCurrentUser.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));

// Mock supabase server and admin
const mockAuthGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: vi.fn().mockResolvedValue({
    auth: { getUser: (...args: unknown[]) => mockAuthGetUser(...args) },
  }),
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

import { isOwnerEmailAllowed, isPlatformAdminById, getCurrentUser } from "../platform-admin/server";

// Store original env
const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore env
  process.env.GIGAVIZ_OWNER_EMAILS = originalEnv.GIGAVIZ_OWNER_EMAILS;
  process.env.ADMIN_EMAILS = originalEnv.ADMIN_EMAILS;
});

describe("isOwnerEmailAllowed", () => {
  it("returns false for null email", () => {
    process.env.GIGAVIZ_OWNER_EMAILS = "admin@example.com";
    expect(isOwnerEmailAllowed(null)).toBe(false);
  });

  it("returns false for undefined email", () => {
    process.env.GIGAVIZ_OWNER_EMAILS = "admin@example.com";
    expect(isOwnerEmailAllowed(undefined)).toBe(false);
  });

  it("returns false when email not in list", () => {
    process.env.GIGAVIZ_OWNER_EMAILS = "admin@example.com,owner@example.com";
    expect(isOwnerEmailAllowed("random@example.com")).toBe(false);
  });

  it("returns true when email in list", () => {
    process.env.GIGAVIZ_OWNER_EMAILS = "admin@example.com,owner@example.com";
    expect(isOwnerEmailAllowed("admin@example.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    process.env.GIGAVIZ_OWNER_EMAILS = "Admin@Example.com";
    expect(isOwnerEmailAllowed("admin@example.com")).toBe(true);
  });

  it("returns false when env not set", () => {
    delete process.env.GIGAVIZ_OWNER_EMAILS;
    delete process.env.ADMIN_EMAILS;
    expect(isOwnerEmailAllowed("admin@example.com")).toBe(false);
  });

  it("falls back to ADMIN_EMAILS env var", () => {
    delete process.env.GIGAVIZ_OWNER_EMAILS;
    process.env.ADMIN_EMAILS = "fallback@example.com";
    expect(isOwnerEmailAllowed("fallback@example.com")).toBe(true);
  });

  it("handles empty string email", () => {
    process.env.GIGAVIZ_OWNER_EMAILS = "admin@example.com";
    expect(isOwnerEmailAllowed("")).toBe(false);
  });
});

describe("isPlatformAdminById", () => {
  it("returns false for null userId", async () => {
    const result = await isPlatformAdminById(null);
    expect(result).toBe(false);
  });

  it("returns false for undefined userId", async () => {
    const result = await isPlatformAdminById(undefined);
    expect(result).toBe(false);
  });

  it("returns true when user found in platform_admins", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { user_id: "user_123" },
            error: null,
          }),
        }),
      }),
    });

    const result = await isPlatformAdminById("user_123");
    expect(result).toBe(true);
  });

  it("returns false when user not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    });

    const result = await isPlatformAdminById("nonexistent");
    expect(result).toBe(false);
  });

  it("returns false on database error", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "500", message: "DB error" },
          }),
        }),
      }),
    });

    const result = await isPlatformAdminById("user_123");
    expect(result).toBe(false);
  });
});

describe("getCurrentUser", () => {
  it("returns userId and email when authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user_abc", email: "test@example.com" } },
      error: null,
    });

    const result = await getCurrentUser();
    expect(result.userId).toBe("user_abc");
    expect(result.email).toBe("test@example.com");
  });

  it("returns nulls when not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await getCurrentUser();
    expect(result.userId).toBeNull();
    expect(result.email).toBeNull();
  });
});
