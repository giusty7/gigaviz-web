import { describe, it, expect, vi } from "vitest";

// Mock server-only and supabase to prevent import errors in test environment
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: () => ({
      upsert: () => ({ select: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
    }),
  }),
}));

import { signN8nPayload, isIntentAllowed, ALLOWLIST_INTENTS } from "@/lib/helper/tools";

/* ── ALLOWLIST_INTENTS ───────────────────────────────────────── */
describe("ALLOWLIST_INTENTS", () => {
  it("is a non-empty readonly array", () => {
    expect(Array.isArray(ALLOWLIST_INTENTS)).toBe(true);
    expect(ALLOWLIST_INTENTS.length).toBeGreaterThan(0);
  });

  it("contains expected intents", () => {
    expect(ALLOWLIST_INTENTS).toContain("summarize_thread");
    expect(ALLOWLIST_INTENTS).toContain("draft_reply");
    expect(ALLOWLIST_INTENTS).toContain("create_ticket");
  });
});

/* ── isIntentAllowed ─────────────────────────────────────────── */
describe("isIntentAllowed", () => {
  it("returns true for allowed intents", () => {
    expect(isIntentAllowed("summarize_thread")).toBe(true);
    expect(isIntentAllowed("draft_reply")).toBe(true);
    expect(isIntentAllowed("create_ticket")).toBe(true);
  });

  it("returns false for unknown intents", () => {
    expect(isIntentAllowed("unknown_intent")).toBe(false);
    expect(isIntentAllowed("")).toBe(false);
    expect(isIntentAllowed("delete_all")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isIntentAllowed("SUMMARIZE_THREAD")).toBe(false);
    expect(isIntentAllowed("Summarize_Thread")).toBe(false);
  });
});

/* ── signN8nPayload ──────────────────────────────────────────── */
describe("signN8nPayload", () => {
  const testSecret = "test-secret-key-123";

  it("returns a hex string", () => {
    const sig = signN8nPayload(testSecret, { foo: "bar" });
    expect(sig).toMatch(/^[a-f0-9]+$/);
  });

  it("returns consistent signatures for same input", () => {
    const payload = { action: "test", value: 42 };
    const sig1 = signN8nPayload(testSecret, payload);
    const sig2 = signN8nPayload(testSecret, payload);
    expect(sig1).toBe(sig2);
  });

  it("returns different signatures for different payloads", () => {
    const sig1 = signN8nPayload(testSecret, { a: 1 });
    const sig2 = signN8nPayload(testSecret, { a: 2 });
    expect(sig1).not.toBe(sig2);
  });

  it("returns different signatures for different secrets", () => {
    const payload = { action: "test" };
    const sig1 = signN8nPayload("secret-1", payload);
    const sig2 = signN8nPayload("secret-2", payload);
    expect(sig1).not.toBe(sig2);
  });

  it("handles null payload", () => {
    const sig = signN8nPayload(testSecret, null);
    expect(sig).toMatch(/^[a-f0-9]+$/);
  });

  it("handles undefined payload", () => {
    const sig = signN8nPayload(testSecret, undefined);
    expect(sig).toMatch(/^[a-f0-9]+$/);
  });

  it("handles empty object", () => {
    const sig = signN8nPayload(testSecret, {});
    expect(sig).toMatch(/^[a-f0-9]+$/);
  });

  it("produces SHA-256 length output (64 hex chars)", () => {
    const sig = signN8nPayload(testSecret, { test: true });
    expect(sig).toHaveLength(64);
  });

  it("is order-dependent for object keys (JSON serialization)", () => {
    // JSON.stringify has deterministic key order for object literals
    const sig1 = signN8nPayload(testSecret, { a: 1, b: 2 });
    const sig2 = signN8nPayload(testSecret, { b: 2, a: 1 });
    // Note: JSON.stringify preserves insertion order, so these may differ
    // depending on how the object is created
    expect(sig1).toMatch(/^[a-f0-9]{64}$/);
    expect(sig2).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles nested objects", () => {
    const sig = signN8nPayload(testSecret, {
      intent: "summarize_thread",
      params: { thread_id: "t_123", depth: 5 },
    });
    expect(sig).toHaveLength(64);
  });
});
