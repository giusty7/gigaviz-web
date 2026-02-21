/**
 * Integration tests for GET /api/tokens/wallet
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

// Guard mock
const { mockGuardWorkspace } = vi.hoisted(() => ({
  mockGuardWorkspace: vi.fn(),
}));
vi.mock("@/lib/auth/guard", () => ({
  guardWorkspace: mockGuardWorkspace,
}));

// Tokens mock
const { mockGetWallet } = vi.hoisted(() => ({
  mockGetWallet: vi.fn(),
}));
vi.mock("@/lib/tokens", () => ({
  getWallet: mockGetWallet,
}));

// ─── Import route handler ──────────────────────────────────────────

import { GET } from "@/app/api/tokens/wallet/route";

// ─── Helpers ───────────────────────────────────────────────────────

function makeReq(workspaceId?: string) {
  const url = workspaceId
    ? `http://localhost/api/tokens/wallet?workspaceId=${workspaceId}`
    : "http://localhost/api/tokens/wallet";
  return new NextRequest(url);
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("GET /api/tokens/wallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGuardWorkspace.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await GET(makeReq("ws_123"), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(401);
  });

  it("returns 403 when not a workspace member", async () => {
    mockGuardWorkspace.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { error: "forbidden", reason: "workspace_access_denied" },
        { status: 403 }
      ),
    });

    const res = await GET(makeReq("ws_123"), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden");
  });

  it("returns wallet data for authenticated workspace member", async () => {
    const mockWallet = {
      id: "wallet_1",
      workspace_id: "ws_123",
      balance: 5000,
      lifetime_credits: 10000,
      lifetime_debits: 5000,
    };

    mockGuardWorkspace.mockResolvedValue({
      ok: true,
      workspaceId: "ws_123",
      withCookies: (res: NextResponse) => res,
      user: { id: "user_1", email: "test@example.com" },
      role: "owner",
    });
    mockGetWallet.mockResolvedValue(mockWallet);

    const res = await GET(makeReq("ws_123"), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wallet).toEqual(mockWallet);
    expect(mockGetWallet).toHaveBeenCalledWith("ws_123");
  });

  it("returns null wallet for workspace with no wallet yet", async () => {
    mockGuardWorkspace.mockResolvedValue({
      ok: true,
      workspaceId: "ws_456",
      withCookies: (res: NextResponse) => res,
      user: { id: "user_1", email: "test@example.com" },
      role: "member",
    });
    mockGetWallet.mockResolvedValue(null);

    const res = await GET(makeReq("ws_456"), {
      params: Promise.resolve({}),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wallet).toBeNull();
  });
});
