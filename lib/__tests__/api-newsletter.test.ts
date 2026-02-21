/**
 * Integration tests for POST /api/newsletter/subscribe
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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

const { mockUpsert, mockFrom } = vi.hoisted(() => ({
  mockUpsert: vi.fn().mockResolvedValue({ error: null }),
  mockFrom: vi.fn(),
}));

mockFrom.mockReturnValue({ upsert: mockUpsert });

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: mockFrom }),
}));

// ─── Import route handler ──────────────────────────────────────────

import { POST } from "@/app/api/newsletter/subscribe/route";

// ─── Helpers ───────────────────────────────────────────────────────

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("subscribes with valid email — returns 200", async () => {
    const res = await POST(makeReq({ email: "user@example.com" }), {
      params: Promise.resolve({}),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.message).toBe("Subscribed successfully");
    expect(mockFrom).toHaveBeenCalledWith("newsletter_subscribers");
  });

  it("normalizes email to lowercase", async () => {
    await POST(makeReq({ email: "USER@Example.COM" }), {
      params: Promise.resolve({}),
    });

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.email).toBe("user@example.com");
  });

  it("accepts custom source and locale", async () => {
    await POST(
      makeReq({ email: "test@test.com", source: "footer", locale: "id" }),
      { params: Promise.resolve({}) }
    );

    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall.source).toBe("footer");
    expect(upsertCall.locale).toBe("id");
  });

  it("returns 400 for invalid email (Zod validation)", async () => {
    const res = await POST(makeReq({ email: "not-an-email" }), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing email", async () => {
    const res = await POST(makeReq({}), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(400);
  });

  it("handles duplicate email (23505) as success", async () => {
    mockUpsert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate key" },
    });

    const res = await POST(makeReq({ email: "user@example.com" }), {
      params: Promise.resolve({}),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.message).toBe("Already subscribed");
  });

  it("returns 500 on DB error", async () => {
    mockUpsert.mockResolvedValueOnce({
      error: { code: "PGRST000", message: "connection refused" },
    });

    const res = await POST(makeReq({ email: "user@example.com" }), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(500);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
