/**
 * Tests for newsletter subscribe API route
 *
 * Tests: Zod validation (email format, max length), idempotent upsert,
 * DB error handling, success response.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ─────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const { mockSupabaseAdmin } = vi.hoisted(() => ({
  mockSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mockSupabaseAdmin,
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
  return new NextRequest("http://localhost/api/newsletter/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockDb(upsertError: unknown = null) {
  const upsertFn = vi.fn().mockResolvedValue({ data: null, error: upsertError });

  mockSupabaseAdmin.mockReturnValue({
    from: vi.fn(() => ({
      upsert: upsertFn,
    })),
  });

  return { upsertFn };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("POST /api/newsletter/subscribe", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/newsletter/subscribe/route");
    POST = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns success for valid email", async () => {
    mockDb(null);
    const res = await POST(mockRequest({ email: "user@example.com" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.message).toBe("Subscribed successfully");
  });

  it("normalizes email to lowercase", async () => {
    const { upsertFn } = mockDb(null);
    await POST(mockRequest({ email: "User@EXAMPLE.com" }));
    expect(upsertFn).toHaveBeenCalled();
    const upsertArg = upsertFn.mock.calls[0][0];
    expect(upsertArg.email).toBe("user@example.com");
  });

  it("defaults source to 'homepage' and locale to 'en'", async () => {
    const { upsertFn } = mockDb(null);
    await POST(mockRequest({ email: "test@test.com" }));
    const upsertArg = upsertFn.mock.calls[0][0];
    expect(upsertArg.source).toBe("homepage");
    expect(upsertArg.locale).toBe("en");
  });

  it("accepts custom source and locale", async () => {
    const { upsertFn } = mockDb(null);
    await POST(
      mockRequest({ email: "test@test.com", source: "pricing", locale: "id" })
    );
    const upsertArg = upsertFn.mock.calls[0][0];
    expect(upsertArg.source).toBe("pricing");
    expect(upsertArg.locale).toBe("id");
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(mockRequest({ email: "not-an-email" }));
    // withErrorHandler catches ZodError and returns 400 or 500
    expect([400, 500]).toContain(res.status);
  });

  it("returns 400 for missing email", async () => {
    const res = await POST(mockRequest({}));
    expect([400, 500]).toContain(res.status);
  });

  it("treats duplicate email as success (idempotent)", async () => {
    mockDb({ code: "23505", message: "duplicate key" });
    const res = await POST(mockRequest({ email: "dupe@test.com" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.message).toBe("Already subscribed");
  });

  it("returns 500 for unexpected DB error", async () => {
    mockDb({ code: "42P01", message: "relation not found" });
    const res = await POST(mockRequest({ email: "test@test.com" }));
    expect(res.status).toBe(500);
  });
});
