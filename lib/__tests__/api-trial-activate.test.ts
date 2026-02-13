/**
 * Tests for free trial activation API route
 *
 * Tests: auth, RBAC, plan validation, trial-already-used guard,
 * active-subscription guard, successful trial creation, quota seeding.
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

vi.mock("@/lib/quotas", () => ({
  seedWorkspaceQuotas: vi.fn().mockResolvedValue(undefined),
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

const WS_ID = "ws_trial_test";

function mockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/billing/trial/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGuardOk(role = "owner") {
  mockGuardWorkspace.mockResolvedValue({
    ok: true,
    withCookies: mockWithCookies,
    user: { id: "user_123", email: "owner@test.com" },
    workspaceId: WS_ID,
    role,
    body: null,
  });
}

function mockDb(existingSub: unknown = null, upsertResult: unknown = null, upsertError: unknown = null) {
  const selectSingle = vi.fn().mockResolvedValue({ data: upsertResult, error: upsertError });
  const selectChain = vi.fn().mockReturnValue({ single: selectSingle });
  const upsertChain = vi.fn().mockReturnValue({ select: selectChain });

  const maybeSingleFn = vi.fn().mockResolvedValue({ data: existingSub, error: null });
  const existingEq = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
  const existingSelect = vi.fn().mockReturnValue({ eq: existingEq });

  const fromFn = vi.fn();
  // First call: check existing subscription; subsequent calls: upsert
  fromFn.mockReturnValueOnce({ select: existingSelect });
  fromFn.mockReturnValue({ upsert: upsertChain });

  mockSupabaseAdmin.mockReturnValue({ from: fromFn });
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("POST /api/billing/trial/activate", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/billing/trial/activate/route");
    POST = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when not authenticated", async () => {
    const res = Response.json({ error: "unauthorized" }, { status: 401 });
    mockGuardWorkspace.mockResolvedValue({ ok: false, response: res });

    const result = await POST(mockRequest({ planCode: "starter" }));
    expect(result.status).toBe(401);
  });

  it("returns 403 when user is a regular member", async () => {
    makeGuardOk("member");
    mockRequireWorkspaceRole.mockReturnValue(false);

    const res = await POST(mockRequest({ planCode: "starter" }));
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid plan code", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(mockRequest({ planCode: "enterprise" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for free plan (only starter/growth/business)", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const res = await POST(mockRequest({ planCode: "free" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when trial already active", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb({ id: "sub_1", status: "trialing", provider: "trial", plan_code: "growth" });

    const res = await POST(mockRequest({ planCode: "growth" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("trial_active");
  });

  it("returns 400 when trial already used (prevents abuse)", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb({ id: "sub_1", status: "expired", provider: "trial", plan_code: "starter" });

    const res = await POST(mockRequest({ planCode: "starter" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("trial_used");
  });

  it("returns 400 when workspace has active paid subscription", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb({ id: "sub_1", status: "active", provider: "midtrans", plan_code: "business" });

    const res = await POST(mockRequest({ planCode: "growth" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("already_subscribed");
  });

  it("activates trial successfully for new workspace", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const subscription = {
      plan_id: "growth",
      plan_code: "growth",
      status: "trialing",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
    };
    mockDb(null, subscription, null);

    const res = await POST(mockRequest({ planCode: "growth" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.subscription.status).toBe("trialing");
    expect(data.trialDays).toBe(14);
  });

  it("allows trial for workspace with manual/free subscription", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);

    const subscription = {
      plan_id: "starter",
      plan_code: "starter",
      status: "trialing",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
    };
    // Existing sub with manual provider (free plan) — should allow trial
    mockDb(
      { id: "sub_1", status: "active", provider: "manual", plan_code: "free" },
      subscription,
      null
    );

    const res = await POST(mockRequest({ planCode: "starter" }));
    expect(res.status).toBe(200);
  });

  it("returns 500 when DB upsert fails", async () => {
    makeGuardOk("owner");
    mockRequireWorkspaceRole.mockReturnValue(true);
    mockDb(null, null, { code: "23505", message: "conflict" });

    const res = await POST(mockRequest({ planCode: "business" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.code).toBe("trial_activation_failed");
  });
});
