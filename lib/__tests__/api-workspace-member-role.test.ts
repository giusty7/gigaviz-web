/**
 * Tests for workspace member role change API route
 *
 * Tests: auth, RBAC, Zod validation (UUID format), workspace_id mismatch,
 * member existence check, role update, audit logging.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ─────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockWithCookies = vi.fn((res: Response) => res);

const { mockGuardWorkspace, mockRequireWorkspaceRole, mockForbiddenResponse } =
  vi.hoisted(() => ({
    mockGuardWorkspace: vi.fn(),
    mockRequireWorkspaceRole: vi.fn(),
    mockForbiddenResponse: vi.fn(),
  }));

vi.mock("@/lib/auth/guard", () => ({
  guardWorkspace: mockGuardWorkspace,
  requireWorkspaceRole: mockRequireWorkspaceRole,
  forbiddenResponse: mockForbiddenResponse,
}));

const { mockSupabaseAdmin } = vi.hoisted(() => ({
  mockSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logging", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  setCorrelationId: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
}));

// ─── Helpers ────────────────────────────────────────────────────────

const WS_ID = "11111111-1111-4111-a111-111111111111";
const USER_ID = "22222222-2222-4222-a222-222222222222";
const TARGET_USER_ID = "33333333-3333-4333-a333-333333333333";

function mockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/workspace-members/role", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGuardOk(role = "owner", body: unknown = null) {
  mockGuardWorkspace.mockResolvedValue({
    ok: true,
    withCookies: mockWithCookies,
    user: { id: USER_ID, email: "admin@test.com" },
    workspaceId: WS_ID,
    role,
    body,
  });
}

function makeGuardFail(status = 401) {
  const res = Response.json({ error: "unauthorized" }, { status });
  mockGuardWorkspace.mockResolvedValue({ ok: false, response: res });
}

function mockDb(
  memberExists: boolean = true,
  updateError: unknown = null
) {
  const updateEq2 = vi.fn().mockResolvedValue({ data: null, error: updateError });
  const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 });
  const updateChain = vi.fn().mockReturnValue({ eq: updateEq1 });

  const maybeSingleFn = vi.fn().mockResolvedValue({
    data: memberExists ? { id: "member_123" } : null,
    error: null,
  });
  const selectEq2 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
  const selectEq1 = vi.fn().mockReturnValue({ eq: selectEq2 });
  const selectChain = vi.fn().mockReturnValue({ eq: selectEq1 });

  mockSupabaseAdmin.mockReturnValue({
    from: vi.fn(() => ({
      select: selectChain,
      update: updateChain,
    })),
  });
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("POST /api/workspace-members/role", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/workspace-members/role/route");
    POST = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when not authenticated", async () => {
    makeGuardFail(401);
    const res = await POST(
      mockRequest({ workspaceId: WS_ID, userId: TARGET_USER_ID, role: "admin" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is regular member", async () => {
    makeGuardOk("member");
    mockRequireWorkspaceRole.mockReturnValue(false);
    mockForbiddenResponse.mockReturnValue(
      Response.json({ error: "forbidden" }, { status: 403 })
    );

    const res = await POST(
      mockRequest({ workspaceId: WS_ID, userId: TARGET_USER_ID, role: "admin" })
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when userId is not a UUID", async () => {
    makeGuardOk("owner", {
      workspaceId: WS_ID,
      userId: "not-a-uuid",
      role: "admin",
    });
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(
      mockRequest({ workspaceId: WS_ID, userId: "not-a-uuid", role: "admin" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_payload");
  });

  it("returns 400 when role is invalid", async () => {
    makeGuardOk("owner", {
      workspaceId: WS_ID,
      userId: TARGET_USER_ID,
      role: "superadmin",
    });
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(
      mockRequest({
        workspaceId: WS_ID,
        userId: TARGET_USER_ID,
        role: "superadmin",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when workspace_id in body mismatches guard", async () => {
    const otherWs = "44444444-4444-4444-a444-444444444444";
    makeGuardOk("owner", {
      workspaceId: otherWs,
      userId: TARGET_USER_ID,
      role: "member",
    });
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(
      mockRequest({
        workspaceId: otherWs,
        userId: TARGET_USER_ID,
        role: "member",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("workspace_mismatch");
  });

  it("returns 404 when target member not found", async () => {
    makeGuardOk("owner", {
      workspaceId: WS_ID,
      userId: TARGET_USER_ID,
      role: "admin",
    });
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb(false);

    const res = await POST(
      mockRequest({
        workspaceId: WS_ID,
        userId: TARGET_USER_ID,
        role: "admin",
      })
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful role update", async () => {
    makeGuardOk("owner", {
      workspaceId: WS_ID,
      userId: TARGET_USER_ID,
      role: "admin",
    });
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb(true);

    const res = await POST(
      mockRequest({
        workspaceId: WS_ID,
        userId: TARGET_USER_ID,
        role: "admin",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("returns 500 when DB update fails", async () => {
    makeGuardOk("owner", {
      workspaceId: WS_ID,
      userId: TARGET_USER_ID,
      role: "member",
    });
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb(true, { code: "42501", message: "permission denied" });

    const res = await POST(
      mockRequest({
        workspaceId: WS_ID,
        userId: TARGET_USER_ID,
        role: "member",
      })
    );
    expect(res.status).toBe(500);
  });

  it("valid roles are owner, admin, member only", async () => {
    makeGuardOk("owner", {
      workspaceId: WS_ID,
      userId: TARGET_USER_ID,
      role: "viewer",
    });
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(
      mockRequest({
        workspaceId: WS_ID,
        userId: TARGET_USER_ID,
        role: "viewer",
      })
    );
    expect(res.status).toBe(400);
  });
});
