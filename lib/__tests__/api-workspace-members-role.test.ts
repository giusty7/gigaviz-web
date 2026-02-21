/**
 * Integration tests for POST /api/workspace-members/role
 *
 * Tests Zod validation, role-based access, DB operations, and audit logging.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ─── Module Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/logging", () => ({
  logger: mockLogger,
  setCorrelationId: vi.fn(),
}));

// Guard mocks
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

// Audit mock
const { mockRecordAuditEvent } = vi.hoisted(() => ({
  mockRecordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent,
}));

// Supabase admin mock
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: mockFrom }),
}));

// ─── Import route handler ──────────────────────────────────────────

import { POST } from "@/app/api/workspace-members/role/route";

// ─── Helpers ───────────────────────────────────────────────────────

const WORKSPACE_ID = randomUUID();
const ACTOR_ID = randomUUID();
const TARGET_USER_ID = randomUUID();

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/workspace-members/role", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function guardOk(role = "owner", body: unknown = null) {
  return {
    ok: true as const,
    workspaceId: WORKSPACE_ID,
    role,
    user: { id: ACTOR_ID, email: "admin@example.com" },
    withCookies: (res: NextResponse) => res,
    body,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("POST /api/workspace-members/role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: forbiddenResponse returns a 403 NextResponse
    mockForbiddenResponse.mockImplementation(
      (wc: (r: NextResponse) => NextResponse) =>
        wc(
          NextResponse.json(
            { error: "forbidden", reason: "workspace_access_denied" },
            { status: 403 }
          )
        )
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockGuardWorkspace.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(
      makeReq({
        workspaceId: WORKSPACE_ID,
        userId: TARGET_USER_ID,
        role: "member",
      }),
      { params: Promise.resolve({}) }
    );

    expect(res.status).toBe(401);
  });

  it("returns 403 when requester is not owner/admin", async () => {
    const body = {
      workspaceId: WORKSPACE_ID,
      userId: TARGET_USER_ID,
      role: "admin",
    };
    mockGuardWorkspace.mockResolvedValue(guardOk("member", body));
    mockRequireWorkspaceRole.mockReturnValue(false);

    const res = await POST(makeReq(body), { params: Promise.resolve({}) });

    expect(res.status).toBe(403);
    expect(mockRequireWorkspaceRole).toHaveBeenCalledWith("member", [
      "owner",
      "admin",
    ]);
  });

  it("returns 400 for invalid payload (missing userId)", async () => {
    const body = { workspaceId: WORKSPACE_ID, role: "member" };
    mockGuardWorkspace.mockResolvedValue(guardOk("owner", body));
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(makeReq(body), { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_payload");
  });

  it("returns 400 for non-UUID userId", async () => {
    const body = {
      workspaceId: WORKSPACE_ID,
      userId: "not-a-uuid",
      role: "member",
    };
    mockGuardWorkspace.mockResolvedValue(guardOk("owner", body));
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(makeReq(body), { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_payload");
  });

  it("returns 400 when body workspaceId mismatches guard workspaceId", async () => {
    const differentWsId = randomUUID();
    const body = {
      workspaceId: differentWsId,
      userId: TARGET_USER_ID,
      role: "member",
    };
    mockGuardWorkspace.mockResolvedValue(guardOk("owner", body));
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(makeReq(body), { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("workspace_mismatch");
  });

  it("returns 404 when target member not found", async () => {
    const body = {
      workspaceId: WORKSPACE_ID,
      userId: TARGET_USER_ID,
      role: "admin",
    };
    mockGuardWorkspace.mockResolvedValue(guardOk("owner", body));
    mockRequireWorkspaceRole.mockReturnValue(true);

    // Member lookup returns null
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    const res = await POST(makeReq(body), { params: Promise.resolve({}) });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("not_found");
  });

  it("updates role successfully and records audit event", async () => {
    const body = {
      workspaceId: WORKSPACE_ID,
      userId: TARGET_USER_ID,
      role: "admin",
    };
    mockGuardWorkspace.mockResolvedValue(guardOk("owner", body));
    mockRequireWorkspaceRole.mockReturnValue(true);

    // Member lookup — found
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: { id: "member_1" }, error: null }),
          }),
        }),
      }),
    });

    // Update member role — success
    mockFrom.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const res = await POST(makeReq(body), { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    // Verify audit event was fired
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WORKSPACE_ID,
        actorUserId: ACTOR_ID,
        action: "member.role_updated",
        meta: { targetUserId: TARGET_USER_ID, role: "admin" },
      })
    );
  });

  it("returns 500 on DB update error", async () => {
    const body = {
      workspaceId: WORKSPACE_ID,
      userId: TARGET_USER_ID,
      role: "member",
    };
    mockGuardWorkspace.mockResolvedValue(guardOk("owner", body));
    mockRequireWorkspaceRole.mockReturnValue(true);

    // Member lookup — found
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: { id: "member_1" }, error: null }),
          }),
        }),
      }),
    });

    // Update fails
    mockFrom.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: "connection refused" },
          }),
        }),
      }),
    });

    const res = await POST(makeReq(body), { params: Promise.resolve({}) });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("db_error");
  });
});
