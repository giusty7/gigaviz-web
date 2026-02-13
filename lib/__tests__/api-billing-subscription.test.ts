/**
 * Tests for billing subscription set API route
 *
 * Tests: auth, RBAC (owner/admin only), Zod validation, plan lookup,
 * subscription upsert, rate limiting, workspace scoping.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ─────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockWithCookies = vi.fn((res: Response) => res);

const { mockGuardWorkspace, mockRequireWorkspaceRole } = vi.hoisted(() => ({
  mockGuardWorkspace: vi.fn(),
  mockRequireWorkspaceRole: vi.fn(),
}));

vi.mock("@/lib/auth/guard", () => ({
  guardWorkspace: mockGuardWorkspace,
  requireWorkspaceRole: mockRequireWorkspaceRole,
}));

const { mockSupabaseAdmin } = vi.hoisted(() => ({
  mockSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ ok: true })),
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

function mockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/billing/subscription/set", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGuardOk(role = "owner") {
  mockGuardWorkspace.mockResolvedValue({
    ok: true,
    withCookies: mockWithCookies,
    user: { id: "user_123", email: "test@example.com" },
    workspaceId: "ws_abc",
    role,
    body: null,
  });
}

function makeGuardFail(status = 401) {
  const res = Response.json({ error: "unauthorized" }, { status });
  mockGuardWorkspace.mockResolvedValue({ ok: false, response: res });
}

function mockDb(planData: unknown = null, upsertResult: unknown = null, upsertError: unknown = null) {
  const selectSingle = vi.fn().mockResolvedValue({ data: upsertResult, error: upsertError });
  const selectChain = vi.fn().mockReturnValue({ single: selectSingle });
  const upsertChain = vi.fn().mockReturnValue({ select: selectChain });
  const maybeSingleFn = vi.fn().mockResolvedValue({ data: planData, error: null });
  const eqChain2 = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
  const selectPlanChain = vi.fn().mockReturnValue({ eq: eqChain2 });

  mockSupabaseAdmin.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "plans") {
        return { select: selectPlanChain };
      }
      if (table === "subscriptions") {
        return { upsert: upsertChain };
      }
      return {};
    }),
  });
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("POST /api/billing/subscription/set", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to pick up fresh mocks
    const mod = await import("@/app/api/billing/subscription/set/route");
    POST = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when not authenticated", async () => {
    makeGuardFail(401);
    const res = await POST(mockRequest({ planCode: "growth" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is member (not owner/admin)", async () => {
    makeGuardOk("member");
    mockRequireWorkspaceRole.mockReturnValue(false);

    const res = await POST(mockRequest({ planCode: "growth" }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  it("returns 400 when planCode is missing", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(mockRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("bad_request");
  });

  it("returns 400 when planCode is empty string", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(mockRequest({ planCode: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when plan not found in DB", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb(null); // no plan returned

    const res = await POST(mockRequest({ planCode: "nonexistent" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.code).toBe("plan_not_found");
  });

  it("returns 400 when plan is inactive", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb({ code: "old_plan", type: "individual", seat_limit: 1, is_active: false });

    const res = await POST(mockRequest({ planCode: "old_plan" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("plan_inactive");
  });

  it("returns 200 with subscription on success", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const plan = { code: "growth", type: "team", seat_limit: 5, is_active: true };
    const subscription = {
      plan_id: "growth",
      plan_code: "growth",
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      provider: "manual",
      provider_ref: "manual",
    };
    mockDb(plan, subscription, null);

    const res = await POST(mockRequest({ planCode: "growth" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.subscription.plan_code).toBe("growth");
  });

  it("returns 500 when upsert fails", async () => {
    makeGuardOk("admin");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const plan = { code: "starter", type: "individual", seat_limit: 1, is_active: true };
    mockDb(plan, null, { code: "23505", message: "unique violation" });

    const res = await POST(mockRequest({ planCode: "starter" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.code).toBe("subscription_update_failed");
  });

  it("admin can change plan (not just owner)", async () => {
    makeGuardOk("admin");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const plan = { code: "business", type: "team", seat_limit: 10, is_active: true };
    const subscription = { plan_id: "business", plan_code: "business", status: "active" };
    mockDb(plan, subscription, null);

    const res = await POST(mockRequest({ planCode: "business" }));
    expect(res.status).toBe(200);
  });
});
