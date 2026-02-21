/**
 * Integration tests for POST /api/workspaces (workspace creation)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

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

// Auth guard mock
const { mockRequireUser } = vi.hoisted(() => ({
  mockRequireUser: vi.fn(),
}));
vi.mock("@/lib/auth/guard", () => ({
  requireUser: mockRequireUser,
  guardWorkspace: vi.fn(),
}));

// Audit mock
vi.mock("@/lib/audit", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

// Quotas mock
vi.mock("@/lib/quotas", () => ({
  seedWorkspaceQuotas: vi.fn().mockResolvedValue(undefined),
}));

// Supabase admin mock
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: mockFrom }),
}));

// ─── Import route handler ──────────────────────────────────────────

import { POST } from "@/app/api/workspaces/route";

// ─── Helpers ───────────────────────────────────────────────────────

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/workspaces", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const mockUser = {
  id: "user_123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

// ─── Tests ─────────────────────────────────────────────────────────

describe("POST /api/workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockRequireUser.mockResolvedValue({
      ok: true,
      user: mockUser,
      withCookies: (res: NextResponse) => res,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(makeReq({ name: "Test", slug: "test" }), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid payload (missing name)", async () => {
    const res = await POST(makeReq({ slug: "my-ws" }), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_payload");
  });

  it("returns 400 for empty body", async () => {
    const req = new NextRequest("http://localhost/api/workspaces", {
      method: "POST",
      body: "invalid json{{{",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
  });

  it("returns 409 when slug already taken", async () => {
    // Slug check: existing workspace found
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: { id: "existing" }, error: null }),
        }),
      }),
    });

    const res = await POST(
      makeReq({ name: "Test WS", slug: "taken-slug", workspaceType: "team" }),
      { params: Promise.resolve({}) }
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("slug_taken");
  });

  it("creates workspace successfully", async () => {
    const newWs = { id: "ws_new", slug: "new-ws" };

    // 1. Slug check: no existing
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    // 2. Insert workspace
    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newWs, error: null }),
        }),
      }),
    });

    // 3. Insert member
    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    const res = await POST(
      makeReq({ name: "New Workspace", slug: "new-ws", workspaceType: "team" }),
      { params: Promise.resolve({}) }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.workspace.slug).toBe("new-ws");
  });

  it("returns 500 on DB insert error", async () => {
    // Slug check: no existing
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    // Insert fails
    mockFrom.mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValue({ data: null, error: { message: "DB error" } }),
        }),
      }),
    });

    const res = await POST(
      makeReq({ name: "Test Workspace", slug: "test-ws-fail", workspaceType: "team" }),
      { params: Promise.resolve({}) }
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("db_error");
  });
});
