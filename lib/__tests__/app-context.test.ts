/**
 * Tests for lib/app-context.ts
 *
 * Tests getAppContext — the core auth/workspace resolver used in every page.
 * This is a critical security function: it gates all workspace-scoped data.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock functions so they can be referenced inside vi.mock factories
const {
  mockCookieGet,
  mockGetSafeUser,
  mockEnsureProfile,
  mockGetUserWorkspaces,
  mockResolveCurrentWorkspace,
  mockGetEffectiveEntitlements,
} = vi.hoisted(() => ({
  mockCookieGet: vi.fn(),
  mockGetSafeUser: vi.fn(),
  mockEnsureProfile: vi.fn(),
  mockGetUserWorkspaces: vi.fn(),
  mockResolveCurrentWorkspace: vi.fn(),
  mockGetEffectiveEntitlements: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (...args: unknown[]) => mockCookieGet(...args),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/safe-user", () => ({
  getSafeUser: (...args: unknown[]) => mockGetSafeUser(...args),
}));

vi.mock("@/lib/profiles", () => ({
  ensureProfile: (...args: unknown[]) => mockEnsureProfile(...args),
}));

vi.mock("@/lib/workspaces", () => ({
  getUserWorkspaces: (...args: unknown[]) => mockGetUserWorkspaces(...args),
  resolveCurrentWorkspace: (...args: unknown[]) =>
    mockResolveCurrentWorkspace(...args),
  WORKSPACE_COOKIE: "gv_workspace_id",
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/entitlements/effective", () => ({
  getWorkspaceEffectiveEntitlements: (...args: unknown[]) =>
    mockGetEffectiveEntitlements(...args),
}));

import { getAppContext } from "../app-context";

// ─── Test Data ──────────────────────────────────────────────────────

const testUser = {
  id: "user_123",
  email: "test@example.com",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
};

const testProfile = {
  id: "user_123",
  display_name: "Test User",
  avatar_url: null,
  is_admin: false,
};

const testWorkspaces = [
  {
    id: "ws_1",
    name: "Workspace Alpha",
    slug: "alpha",
    owner_id: "user_123",
    workspace_type: "team",
    description: null,
    created_at: "2026-01-01T00:00:00Z",
    role: "owner",
  },
  {
    id: "ws_2",
    name: "Workspace Beta",
    slug: "beta",
    owner_id: "user_456",
    workspace_type: "team",
    description: null,
    created_at: "2026-01-02T00:00:00Z",
    role: "member",
  },
];

// ─── Tests ──────────────────────────────────────────────────────────

describe("getAppContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieGet.mockReturnValue(undefined);
  });

  it("returns { user: null } when no user is authenticated", async () => {
    mockGetSafeUser.mockResolvedValue({ user: null });

    const ctx = await getAppContext();

    expect(ctx.user).toBeNull();
    // Should NOT have workspace-related properties
    expect(ctx).not.toHaveProperty("workspaces");
  });

  it("returns full context when user is authenticated", async () => {
    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue(testWorkspaces);
    mockCookieGet.mockReturnValue({ value: "ws_1" });
    mockResolveCurrentWorkspace.mockReturnValue(testWorkspaces[0]);
    mockGetEffectiveEntitlements.mockResolvedValue(["meta_hub", "helper"]);

    const ctx = await getAppContext();

    expect(ctx.user).toEqual(testUser);
    expect(ctx.profile).toEqual(testProfile);
    expect(ctx.workspaces).toHaveLength(2);
    expect(ctx.currentWorkspace).toEqual(testWorkspaces[0]);
    expect(ctx.currentRole).toBe("owner");
    expect(ctx.effectiveEntitlements).toEqual(["meta_hub", "helper"]);
  });

  it("resolves workspace by slug parameter", async () => {
    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue(testWorkspaces);
    mockCookieGet.mockReturnValue(undefined);
    mockResolveCurrentWorkspace.mockReturnValue(testWorkspaces[1]);
    mockGetEffectiveEntitlements.mockResolvedValue([]);

    const ctx = await getAppContext("beta");

    // resolveCurrentWorkspace should be called with the slug
    // cookieId is null (via ?? null) when no cookie is set
    expect(mockResolveCurrentWorkspace).toHaveBeenCalledWith(
      testWorkspaces,
      null,
      "beta"
    );
    expect(ctx.currentWorkspace).toEqual(testWorkspaces[1]);
    expect(ctx.currentRole).toBe("member");
  });

  it("returns empty entitlements when no workspace is resolved", async () => {
    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue([]);
    mockCookieGet.mockReturnValue(undefined);
    mockResolveCurrentWorkspace.mockReturnValue(null);

    const ctx = await getAppContext();

    expect(ctx.currentWorkspace).toBeNull();
    expect(ctx.currentRole).toBeNull();
    expect(ctx.effectiveEntitlements).toEqual([]);
    // Should NOT call getWorkspaceEffectiveEntitlements
    expect(mockGetEffectiveEntitlements).not.toHaveBeenCalled();
  });

  it("resolves currentRole from workspaces array", async () => {
    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue(testWorkspaces);
    mockCookieGet.mockReturnValue(undefined);
    // Resolve to ws_2 where user is "member"
    mockResolveCurrentWorkspace.mockReturnValue(testWorkspaces[1]);
    mockGetEffectiveEntitlements.mockResolvedValue([]);

    const ctx = await getAppContext();

    expect(ctx.currentRole).toBe("member");
  });

  it("calls ensureProfile with the authenticated user", async () => {
    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue([]);
    mockCookieGet.mockReturnValue(undefined);
    mockResolveCurrentWorkspace.mockReturnValue(null);

    await getAppContext();

    expect(mockEnsureProfile).toHaveBeenCalledWith(testUser);
  });

  it("calls getUserWorkspaces with user.id", async () => {
    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue([]);
    mockCookieGet.mockReturnValue(undefined);
    mockResolveCurrentWorkspace.mockReturnValue(null);

    await getAppContext();

    expect(mockGetUserWorkspaces).toHaveBeenCalledWith("user_123");
  });

  it("passes workspace cookie to resolveCurrentWorkspace", async () => {
    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue(testWorkspaces);
    mockCookieGet.mockReturnValue({ value: "ws_2" });
    mockResolveCurrentWorkspace.mockReturnValue(testWorkspaces[1]);
    mockGetEffectiveEntitlements.mockResolvedValue([]);

    await getAppContext();

    expect(mockResolveCurrentWorkspace).toHaveBeenCalledWith(
      testWorkspaces,
      "ws_2",
      null
    );
  });

  it("fetches effective entitlements when workspace is resolved", async () => {
    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue(testWorkspaces);
    mockCookieGet.mockReturnValue(undefined);
    mockResolveCurrentWorkspace.mockReturnValue(testWorkspaces[0]);
    mockGetEffectiveEntitlements.mockResolvedValue(["meta_hub", "inbox"]);

    const ctx = await getAppContext();

    expect(mockGetEffectiveEntitlements).toHaveBeenCalledWith("ws_1");
    expect(ctx.effectiveEntitlements).toEqual(["meta_hub", "inbox"]);
  });

  it("returns null for currentRole when workspace not in list", async () => {
    const externalWs = {
      id: "ws_external",
      name: "External",
      slug: "external",
      owner_id: "user_999",
      workspace_type: "team",
      description: null,
      created_at: "2026-01-01T00:00:00Z",
      role: "viewer",
    };

    mockGetSafeUser.mockResolvedValue({ user: testUser });
    mockEnsureProfile.mockResolvedValue(testProfile);
    mockGetUserWorkspaces.mockResolvedValue(testWorkspaces);
    mockCookieGet.mockReturnValue(undefined);
    // resolveCurrentWorkspace returns a workspace NOT in the user's list
    mockResolveCurrentWorkspace.mockReturnValue(externalWs);
    mockGetEffectiveEntitlements.mockResolvedValue([]);

    const ctx = await getAppContext();

    // Since ws_external is not in testWorkspaces, role lookup fails
    expect(ctx.currentRole).toBeNull();
  });
});
