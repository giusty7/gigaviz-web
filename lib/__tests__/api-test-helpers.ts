/**
 * API Route Test Helpers
 *
 * Provides mock setup utilities for testing Next.js API routes
 * that use withErrorHandler, requirePlatformAdmin, Supabase, etc.
 */
import { vi } from "vitest";
import { NextRequest } from "next/server";

// ─── Request Builders ─────────────────────────────────────────────

/** Build a NextRequest for testing API routes */
export function buildRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {}, searchParams } = options;
  const baseUrl = "http://localhost:3000";
  const fullUrl = new URL(url, baseUrl);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      fullUrl.searchParams.set(key, value);
    }
  }

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(fullUrl, init as any);
}

/** Build a POST request with JSON body */
export function buildPostRequest(url: string, body: unknown): NextRequest {
  return buildRequest(url, { method: "POST", body });
}

/** Build a PATCH request with JSON body */
export function buildPatchRequest(url: string, body: unknown): NextRequest {
  return buildRequest(url, { method: "PATCH", body });
}

/** Build a DELETE request */
export function buildDeleteRequest(
  url: string,
  searchParams?: Record<string, string>
): NextRequest {
  return buildRequest(url, { method: "DELETE", searchParams });
}

// ─── Response Helpers ─────────────────────────────────────────────

/** Parse JSON from NextResponse */
export async function parseResponse(response: Response) {
  const json = await response.json();
  return { status: response.status, body: json };
}

// ─── Mock Platform Admin ──────────────────────────────────────────

/** Create a mock platform admin context (ok: true) */
export function mockAdminContext(overrides?: { user?: Record<string, unknown>; [key: string]: unknown }) {
  return {
    ok: true as const,
    user: {
      id: "user_admin_123",
      email: "admin@gigaviz.com",
      email_confirmed_at: new Date().toISOString(),
      ...(overrides?.user ?? {}),
    },
    actorEmail: "admin@gigaviz.com",
    actorRole: "platform_admin",
    db: createMockDb(),
    ...overrides,
  };
}

/** Create a mock unauthenticated context */
export function mockUnauthContext() {
  return { ok: false as const, reason: "not_authenticated" as const };
}

/** Create a mock forbidden context */
export function mockForbiddenContext() {
  return { ok: false as const, reason: "not_platform_admin" as const };
}

// ─── Mock Supabase DB ─────────────────────────────────────────────

/** Create a minimal chainable mock DB */
export function createMockDb() {
  const createChain = (resolvedValue: unknown = { data: null, error: null }) => {
    const chain: Record<string, unknown> = {};
    const methods = [
      "select", "insert", "update", "delete", "upsert",
      "eq", "neq", "in", "is", "gt", "lt", "gte", "lte",
      "order", "limit", "range", "ilike", "or", "not",
      "contains", "overlaps", "textSearch",
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.single = vi.fn().mockResolvedValue(resolvedValue);
    chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue);
    chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(resolvedValue));
    chain.csv = vi.fn().mockResolvedValue(resolvedValue);
    return chain;
  };

  return {
    from: vi.fn(() => createChain()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user_123", email: "test@example.com" } },
        error: null,
      }),
    },
  };
}

// ─── Default Route Context ────────────────────────────────────────

/** Default route context with params promise */
export function buildRouteContext(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) };
}
