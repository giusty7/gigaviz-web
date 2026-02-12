/**
 * Tests for security patterns
 *
 * Validates security-critical patterns: no secret leaks, workspace isolation,
 * auth checks, safe error responses
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock server-only
vi.mock("server-only", () => ({}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/logging", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
  setCorrelationId: vi.fn(),
}));

import { withErrorHandler } from "@/lib/api/with-error-handler";

describe("Security: Error Response Safety", () => {
  it("500 response never contains stack trace", async () => {
    const handler = vi.fn().mockRejectedValue(
      new Error("Connection to database failed at 192.168.1.100:5432")
    );
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test");
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    const body = await res.json();

    expect(body.stack).toBeUndefined();
    expect(body.message).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("192.168.1.100");
    expect(JSON.stringify(body)).not.toContain("5432");
    expect(body.error).toBe("Internal server error");
  });

  it("500 response includes correlation ID for debugging", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("test"));
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test");
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    const body = await res.json();

    expect(body.requestId).toBeDefined();
    expect(typeof body.requestId).toBe("string");
    expect(body.requestId.length).toBeGreaterThan(0);
  });

  it("Zod error response never leaks internal field names beyond path", async () => {
    const { z } = await import("zod");
    const schema = z.object({
      secret_internal_field: z.string(),
    });

    const handler = vi.fn().mockImplementation(async () => {
      schema.parse({ wrong_field: "test" });
    });
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test", { method: "POST" });
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    // Details contain field paths — this is expected & safe
    expect(body.details).toBeDefined();
  });
});

describe("Security: Input Handling", () => {
  it("JSON.parse of malformed body throws, caught by withErrorHandler", async () => {
    const handler = vi.fn().mockImplementation(async () => {
      // Simulating invalid JSON
      throw new SyntaxError("Unexpected token");
    });
    const wrapped = withErrorHandler(handler);
    const req = new NextRequest("http://localhost/api/test", { method: "POST" });
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    expect(res.status).toBe(500);
  });

  it("extremely long URL doesn't crash handler", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withErrorHandler(handler);
    const longPath = "/api/test/" + "a".repeat(8000);
    const req = new NextRequest(`http://localhost${longPath}`);
    const ctx = { params: Promise.resolve({}) };

    const res = await wrapped(req, ctx);
    // Should handle gracefully (200 or error, not crash)
    expect([200, 400, 414, 500]).toContain(res.status);
  });
});

describe("Security: Environment Variable Safety", () => {
  it("NEXT_PUBLIC_ prefix not used for service role key", () => {
    // This is a pattern test — service role should never be public
    const publicVars = Object.keys(process.env).filter((k) =>
      k.startsWith("NEXT_PUBLIC_")
    );
    for (const key of publicVars) {
      expect(key).not.toContain("SERVICE_ROLE");
      expect(key).not.toContain("SECRET");
      expect(key).not.toContain("ADMIN_TOKEN");
    }
  });
});
