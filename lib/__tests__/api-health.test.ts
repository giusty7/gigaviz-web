/**
 * Integration tests for GET /api/health
 *
 * The health endpoint performs 5 Supabase queries in order:
 *   1. .from("outbox_messages").select("id").limit(1)
 *   2. .from("outbox_messages").select("id", opts).eq("status","queued")
 *   3. .from("outbox_messages").select("id", opts).eq("status","processing")
 *   4. .from("outbox_messages").select("id", opts).eq("status","failed")
 *   5. .from("outbox_messages").select("created_at").eq(...).order(...).limit(1).maybeSingle()
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

/**
 * Build a fully-chainable Supabase mock where every method
 * returns the chain itself (sync), and the chain can also be
 * `await`ed (acts as a thenable resolving to { data, error, count }).
 */
function createChainMock(
  resolveValue: Record<string, unknown> = { data: [], error: null, count: 0 }
) {
  const result = { ...resolveValue };

  const chain: Record<string, unknown> = {};
  // Every chainable method returns the same chain
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  // Terminal methods — also return the chain so callers can keep chaining
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  // Make the chain itself thenable so `await db.from(...).select(...).limit(1)` works
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject);

  return chain;
}

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: mockFrom }),
}));

// ─── Import route handler ──────────────────────────────────────────

import { GET } from "@/app/api/health/route";

// ─── Tests ─────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all 5 queries succeed with zeroes
    mockFrom.mockReturnValue(
      createChainMock({ data: null, error: null, count: 0 })
    );
  });

  it("returns 200 with simple healthy status when CRON_SECRET is set and no auth", async () => {
    process.env.CRON_SECRET = "test-cron-secret";

    const req = new NextRequest("http://localhost/api/health");
    const res = await GET(req, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.status).toBe("healthy");

    delete process.env.CRON_SECRET;
  });

  it("returns detailed health with valid bearer token", async () => {
    process.env.CRON_SECRET = "test-secret";

    const req = new NextRequest("http://localhost/api/health", {
      headers: { authorization: "Bearer test-secret" },
    });

    const res = await GET(req, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty("db");
    expect(body).toHaveProperty("outboxQueued");
    expect(body.outboxQueued).toBe(0);
    expect(body.outboxFailed).toBe(0);

    delete process.env.CRON_SECRET;
  });

  it("returns 200 with full health data when no CRON_SECRET set", async () => {
    delete process.env.CRON_SECRET;
    delete process.env.WEBHOOK_SECRET;

    const req = new NextRequest("http://localhost/api/health");
    const res = await GET(req, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty("db");
  });
});
