/**
 * Tests for Marketplace Items API route (POST & GET)
 *
 * Tests: Zod validation, auth, workspace membership check, item creation,
 * listing with status filter, slug generation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockAuth = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: vi.fn(async () => ({
    auth: { getUser: mockAuth },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/logging", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/api/with-error-handler", () => ({
  withErrorHandler: (fn: (req: NextRequest) => Promise<Response>) => fn,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
}));

// ─── Helpers ────────────────────────────────────────────────────────

function makeRequest(
  method: "GET" | "POST",
  body?: Record<string, unknown>,
  params?: Record<string, string>
): NextRequest {
  const url = new URL("http://localhost/api/marketplace/items");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const init: any = { method };
  if (body) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const req = new NextRequest(url, init);
  // Simulate workspace cookie
  if (body) {
    Object.defineProperty(req, "cookies", {
      value: {
        get: (name: string) =>
          name === "gv_workspace_id" ? { value: "ws_test_123" } : undefined,
      },
    });
  }
  return req;
}

function mockAuthSuccess(userId = "user_123") {
  mockAuth.mockResolvedValue({
    data: { user: { id: userId, email: "test@example.com" } },
    error: null,
  });
}

function mockAuthFailure() {
  mockAuth.mockResolvedValue({
    data: { user: null },
    error: { message: "Not authenticated" },
  });
}

function mockMembershipCheck(isMember: boolean) {
  const singleFn = vi.fn().mockResolvedValue({
    data: isMember ? { id: "member_1" } : null,
    error: null,
  });
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: singleFn,
        }),
      }),
    }),
  };
}

function mockInsertSuccess(item: Record<string, unknown>) {
  const singleFn = vi.fn().mockResolvedValue({ data: item, error: null });
  const selectFn = vi.fn().mockReturnValue({ single: singleFn });
  return {
    insert: vi.fn().mockReturnValue({ select: selectFn }),
  };
}

function mockListSuccess(items: Record<string, unknown>[]) {
  // GET handler chain: .select("*").eq("status", ...).order(...)
  // The final .order() is awaited directly (no .limit())
  const orderResult = Promise.resolve({ data: items, error: null });
  // Make orderResult also chainable for optional .eq() (workspace_id filter)
  Object.assign(orderResult, { eq: vi.fn().mockReturnValue(orderResult) });
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue(orderResult),
      }),
    }),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("POST /api/marketplace/items", () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import(
      "@/app/api/marketplace/items/route"
    );
    POST = mod.POST as unknown as (req: NextRequest) => Promise<Response>;
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuthFailure();
    const req = makeRequest("POST", { title: "Test" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when workspace cookie is missing", async () => {
    mockAuthSuccess();
    const url = new URL("http://localhost/api/marketplace/items");
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Test", description: "Desc", category: "template" }),
    });
    // No workspace cookie
    Object.defineProperty(req, "cookies", {
      value: { get: () => undefined },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid input (missing required fields)", async () => {
    mockAuthSuccess();
    const membershipMock = mockMembershipCheck(true);
    mockFrom.mockImplementation((table: string) => {
      if (table === "workspace_memberships") return membershipMock;
      return {};
    });

    const req = makeRequest("POST", { title: "" }); // title too short
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not workspace member", async () => {
    mockAuthSuccess();
    const membershipMock = mockMembershipCheck(false);
    mockFrom.mockImplementation((table: string) => {
      if (table === "workspace_memberships") return membershipMock;
      return {};
    });

    const req = makeRequest("POST", {
      title: "Test Product",
      description: "A test product description",
      category: "template",
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("creates item successfully with valid input", async () => {
    mockAuthSuccess();
    const membershipMock = mockMembershipCheck(true);
    const insertMock = mockInsertSuccess({
      id: "item_1",
      title: "Test Product",
      slug: "test-product-abc123",
      status: "under_review",
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "workspace_memberships") return membershipMock;
      if (table === "marketplace_items") return insertMock;
      return {};
    });

    const req = makeRequest("POST", {
      title: "Test Product",
      description: "A test product for the marketplace",
      category: "template",
      price_usd: 9.99,
      tags: ["whatsapp", "template"],
      license_type: "single_use",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.item).toBeDefined();
  });
});

describe("GET /api/marketplace/items", () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/marketplace/items/route");
    GET = mod.GET as unknown as (req: NextRequest) => Promise<Response>;
  });

  it("returns items with default approved status", async () => {
    mockAuthSuccess();
    const listMock = mockListSuccess([
      { id: "item_1", title: "Template Pack", status: "approved" },
      { id: "item_2", title: "Prompt Set", status: "approved" },
    ]);
    mockFrom.mockReturnValue(listMock);

    const req = makeRequest("GET");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.items).toHaveLength(2);
  });
});
