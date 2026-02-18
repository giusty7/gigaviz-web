/**
 * Tests for lib/workspaces.ts
 *
 * Tests resolveCurrentWorkspace (pure), getUserWorkspaces (mocked DB), getWorkspaceMembership (mocked DB).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

// Mock supabaseAdmin
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: mockFrom }),
}));

import {
  resolveCurrentWorkspace,
  getUserWorkspaces,
  getWorkspaceMembership,
  type WorkspaceSummary,
} from "../workspaces";

// ─── Factory ────────────────────────────────────────────────────────

function createWs(overrides?: Partial<WorkspaceSummary>): WorkspaceSummary {
  return {
    id: "ws_" + Math.random().toString(36).slice(2, 8),
    name: "Test Workspace",
    slug: "test-workspace",
    owner_id: "user_owner_123",
    workspace_type: "team",
    description: null,
    created_at: new Date().toISOString(),
    role: "member",
    ...overrides,
  };
}

// ─── resolveCurrentWorkspace (pure) ─────────────────────────────────

describe("resolveCurrentWorkspace", () => {
  it("returns null for empty workspace list", () => {
    const result = resolveCurrentWorkspace([], undefined, undefined);
    expect(result).toBeNull();
  });

  it("returns first workspace as default when no slug or cookie", () => {
    const ws1 = createWs({ slug: "first" });
    const ws2 = createWs({ slug: "second" });

    const result = resolveCurrentWorkspace([ws1, ws2]);
    expect(result).toBe(ws1);
  });

  it("matches workspace by slug", () => {
    const ws1 = createWs({ slug: "alpha" });
    const ws2 = createWs({ slug: "beta" });

    const result = resolveCurrentWorkspace([ws1, ws2], null, "beta");
    expect(result).toBe(ws2);
  });

  it("prefers slug over cookie", () => {
    const ws1 = createWs({ id: "id_1", slug: "alpha" });
    const ws2 = createWs({ id: "id_2", slug: "beta" });

    const result = resolveCurrentWorkspace([ws1, ws2], "id_1", "beta");
    expect(result).toBe(ws2); // slug wins
  });

  it("falls back to cookie when slug doesn't match", () => {
    const ws1 = createWs({ id: "id_1", slug: "alpha" });
    const ws2 = createWs({ id: "id_2", slug: "beta" });

    const result = resolveCurrentWorkspace([ws1, ws2], "id_2", "nonexistent");
    expect(result).toBe(ws2); // cookie match
  });

  it("falls back to first workspace when neither slug nor cookie match", () => {
    const ws1 = createWs({ id: "id_1", slug: "alpha" });
    const ws2 = createWs({ id: "id_2", slug: "beta" });

    const result = resolveCurrentWorkspace([ws1, ws2], "id_unknown", "nonexistent");
    expect(result).toBe(ws1);
  });

  it("handles single workspace correctly", () => {
    const ws = createWs({ slug: "only-one" });

    const result = resolveCurrentWorkspace([ws]);
    expect(result).toBe(ws);
  });

  it("matches by cookie ID when slug is null", () => {
    const ws1 = createWs({ id: "id_1" });
    const ws2 = createWs({ id: "id_2" });

    const result = resolveCurrentWorkspace([ws1, ws2], "id_2", null);
    expect(result).toBe(ws2);
  });
});

// ─── getUserWorkspaces (mocked DB) ──────────────────────────────────

describe("getUserWorkspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when user has no memberships", async () => {
    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        // workspace_members query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnValue(
            Promise.resolve({ data: [], error: null })
          ),
        };
      }
      return {};
    });

    const result = await getUserWorkspaces("user_123");
    expect(result).toEqual([]);
  });

  it("returns workspaces with roles merged", async () => {
    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        // workspace_members
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { workspace_id: "ws_1", role: "owner", created_at: "2026-01-01T00:00:00Z" },
              { workspace_id: "ws_2", role: "member", created_at: "2026-01-02T00:00:00Z" },
            ],
            error: null,
          }),
        };
        return chain;
      }
      // workspaces
      const chain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            {
              id: "ws_1",
              name: "Workspace 1",
              slug: "workspace-1",
              owner_id: "user_123",
              workspace_type: "team",
              description: "Test",
              created_at: "2026-01-01T00:00:00Z",
            },
            {
              id: "ws_2",
              name: "Workspace 2",
              slug: "workspace-2",
              owner_id: "user_456",
              workspace_type: "individual",
              description: null,
              created_at: "2026-01-02T00:00:00Z",
            },
          ],
          error: null,
        }),
      };
      return chain;
    });

    const result = await getUserWorkspaces("user_123");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("ws_1");
    expect(result[0].role).toBe("owner");
    expect(result[0].name).toBe("Workspace 1");
    expect(result[1].id).toBe("ws_2");
    expect(result[1].role).toBe("member");
  });

  it("skips memberships with no matching workspace", async () => {
    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { workspace_id: "ws_exists", role: "member", created_at: "2026-01-01T00:00:00Z" },
              { workspace_id: "ws_deleted", role: "member", created_at: "2026-01-02T00:00:00Z" },
            ],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            {
              id: "ws_exists",
              name: "Exists",
              slug: "exists",
              owner_id: "user_1",
              workspace_type: "team",
              description: null,
              created_at: "2026-01-01T00:00:00Z",
            },
            // ws_deleted is NOT in the results
          ],
          error: null,
        }),
      };
    });

    const result = await getUserWorkspaces("user_123");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ws_exists");
  });

  it("throws on memberships query error", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "42P01", message: "relation does not exist" },
      }),
    }));

    await expect(getUserWorkspaces("user_123")).rejects.toThrow();
  });
});

// ─── getWorkspaceMembership (mocked DB) ─────────────────────────────

describe("getWorkspaceMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns membership when user belongs to workspace", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { workspace_id: "ws_1", role: "admin" },
        error: null,
      }),
    }));

    const result = await getWorkspaceMembership("user_123", "ws_1");

    expect(result).toEqual({ workspace_id: "ws_1", role: "admin" });
  });

  it("returns null when user does not belong to workspace", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }));

    const result = await getWorkspaceMembership("user_123", "ws_unknown");

    expect(result).toBeNull();
  });

  it("throws on database error", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "500", message: "internal error" },
      }),
    }));

    await expect(getWorkspaceMembership("user_123", "ws_1")).rejects.toThrow();
  });
});
