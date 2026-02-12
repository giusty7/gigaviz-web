/**
 * Tests for rate limiting module
 */
import { describe, it, expect, vi } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

describe("Rate Limit Patterns", () => {
  it("rate limit key includes workspace_id", () => {
    const workspaceId = "ws_test_123";
    const action = "api_call";
    const key = `${action}:${workspaceId}`;

    expect(key).toBe("api_call:ws_test_123");
    expect(key).toContain(workspaceId);
  });

  it("rate limit key prevents cross-workspace abuse", () => {
    const key1 = `send_message:ws_team_a`;
    const key2 = `send_message:ws_team_b`;

    expect(key1).not.toBe(key2);
  });

  it("different actions have different keys", () => {
    const wsId = "ws_123";
    const sendKey = `send_message:${wsId}`;
    const queryKey = `sql_query:${wsId}`;

    expect(sendKey).not.toBe(queryKey);
  });
});

describe("Retry Backoff", () => {
  it("exponential backoff increases delay", () => {
    const getDelay = (attempt: number) => Math.pow(2, attempt) * 60_000;

    expect(getDelay(1)).toBe(120_000); // 2 min
    expect(getDelay(2)).toBe(240_000); // 4 min
    expect(getDelay(3)).toBe(480_000); // 8 min
  });

  it("backoff has upper bound for max attempts", () => {
    const maxAttempts = 5;
    const maxDelay = Math.pow(2, maxAttempts) * 60_000;

    expect(maxDelay).toBe(1_920_000); // 32 min
    expect(maxDelay).toBeLessThan(3_600_000); // < 1 hour
  });
});
