/**
 * Tests for withErrorHandler HOF
 *
 * Validates: correlation IDs, Zod error → 400, safe 500, slow request logging
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Mock server-only (build-time guard)
vi.mock("server-only", () => ({}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

// Mock logger — use vi.hoisted to avoid hoisting issues
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/logging", () => ({
  logger: mockLogger,
  setCorrelationId: vi.fn(),
}));

import { withErrorHandler, requireMethod } from "@/lib/api/with-error-handler";

describe("withErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes request and context to handler", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withErrorHandler(handler);

    const req = new NextRequest("http://localhost/api/test");
    const ctx = { params: Promise.resolve({ id: "123" }) };

    await wrapped(req, ctx);

    expect(handler).toHaveBeenCalledWith(req, ctx);
  });

  it("returns handler response on success", async () => {
    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ data: "hello" }, { status: 200 })
    );
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test");
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toBe("hello");
  });

  it("converts ZodError to 400 with field details", async () => {
    const schema = z.object({ name: z.string().min(1) });
    const handler = vi.fn().mockImplementation(async () => {
      schema.parse({}); // will throw ZodError
    });
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test", { method: "POST" });
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
    expect(body.details.length).toBeGreaterThan(0);
    expect(body.requestId).toBeDefined();
  });

  it("returns safe 500 for unknown errors (no stack trace)", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("DB connection lost"));
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test");
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(body.requestId).toBeDefined();
    // No stack trace leaked
    expect(body.stack).toBeUndefined();
    expect(body.message).toBeUndefined();
  });

  it("logs errors with structured context", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("test error"));
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test", { method: "POST" });
    const ctx = { params: Promise.resolve({}) };

    await wrapped(req, ctx);

    expect(mockLogger.error).toHaveBeenCalledWith(
      "API route error",
      expect.objectContaining({
        method: "POST",
        url: "/api/test",
        requestId: expect.any(String),
        error: "test error",
      })
    );
  });

  it("handles non-Error throws gracefully", async () => {
    const handler = vi.fn().mockRejectedValue("string error");
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test");
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    expect(res.status).toBe(500);

    expect(mockLogger.error).toHaveBeenCalledWith(
      "API route error",
      expect.objectContaining({
        error: "string error",
      })
    );
  });
});

describe("requireMethod", () => {
  it("returns null for allowed method", () => {
    const req = new NextRequest("http://localhost/api/test", { method: "POST" });
    const result = requireMethod(req, "POST");
    expect(result).toBeNull();
  });

  it("returns null for any of allowed methods (array)", () => {
    const req = new NextRequest("http://localhost/api/test", { method: "PUT" });
    const result = requireMethod(req, ["POST", "PUT"]);
    expect(result).toBeNull();
  });

  it("returns 405 for disallowed method", async () => {
    const req = new NextRequest("http://localhost/api/test", { method: "DELETE" });
    const result = requireMethod(req, "POST");

    expect(result).not.toBeNull();
    expect(result!.status).toBe(405);

    const body = await result!.json();
    expect(body.error).toContain("not allowed");
  });

  it("includes Allow header in 405 response", () => {
    const req = new NextRequest("http://localhost/api/test", { method: "DELETE" });
    const result = requireMethod(req, ["GET", "POST"]);

    expect(result).not.toBeNull();
    expect(result!.headers.get("Allow")).toBe("GET, POST");
  });
});
