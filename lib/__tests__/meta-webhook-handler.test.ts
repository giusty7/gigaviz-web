/**
 * Tests for lib/meta/webhooks/whatsapp-handler.ts
 *
 * Tests Meta webhook verification (GET) and signature validation (POST).
 * Security-critical: ensures only valid webhooks are processed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import { NextRequest } from "next/server";

// Mock server-only + dependencies
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    }),
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitDb: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/logging", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/meta/events", () => ({
  storeMetaEventLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/meta/wa-connections", () => ({
  resolveConnectionForWebhook: vi.fn().mockResolvedValue({ connection: null, error: null }),
  storeOrphanWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

import { handleMetaWhatsAppVerify, handleMetaWhatsAppWebhook } from "../meta/webhooks/whatsapp-handler";

// ─── handleMetaWhatsAppVerify (GET endpoint) ────────────────────────

describe("handleMetaWhatsAppVerify", () => {
  const VERIFY_TOKEN = "test_verify_token_123";

  beforeEach(() => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = VERIFY_TOKEN;
  });

  afterEach(() => {
    delete process.env.META_WEBHOOK_VERIFY_TOKEN;
    delete process.env.WA_WEBHOOK_VERIFY_TOKEN;
    delete process.env.WEBHOOK_VERIFY_TOKEN;
  });

  it("returns 200 with challenge when token matches", () => {
    const url = `http://localhost:3000/api/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=challenge_abc`;
    const req = new NextRequest(url);

    const response = handleMetaWhatsAppVerify(req);

    expect(response.status).toBe(200);
  });

  it("returns 403 when token does not match", () => {
    const url = `http://localhost:3000/api/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=challenge_abc`;
    const req = new NextRequest(url);

    const response = handleMetaWhatsAppVerify(req);

    expect(response.status).toBe(403);
  });

  it("returns 403 when mode is not 'subscribe'", () => {
    const url = `http://localhost:3000/api/webhooks/meta/whatsapp?hub.mode=unsubscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=challenge_abc`;
    const req = new NextRequest(url);

    const response = handleMetaWhatsAppVerify(req);

    expect(response.status).toBe(403);
  });

  it("returns 403 when no query params provided", () => {
    const url = `http://localhost:3000/api/webhooks/meta/whatsapp`;
    const req = new NextRequest(url);

    const response = handleMetaWhatsAppVerify(req);

    expect(response.status).toBe(403);
  });

  it("returns 403 when verify_token is empty", () => {
    const url = `http://localhost:3000/api/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=&hub.challenge=test`;
    const req = new NextRequest(url);

    const response = handleMetaWhatsAppVerify(req);

    expect(response.status).toBe(403);
  });

  it("falls back to WA_WEBHOOK_VERIFY_TOKEN env", () => {
    delete process.env.META_WEBHOOK_VERIFY_TOKEN;
    process.env.WA_WEBHOOK_VERIFY_TOKEN = "wa_token_456";

    const url = `http://localhost:3000/api/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=wa_token_456&hub.challenge=challenge_xyz`;
    const req = new NextRequest(url);

    const response = handleMetaWhatsAppVerify(req);

    expect(response.status).toBe(200);
  });

  it("falls back to WEBHOOK_VERIFY_TOKEN env", () => {
    delete process.env.META_WEBHOOK_VERIFY_TOKEN;
    delete process.env.WA_WEBHOOK_VERIFY_TOKEN;
    process.env.WEBHOOK_VERIFY_TOKEN = "generic_token_789";

    const url = `http://localhost:3000/api/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=generic_token_789&hub.challenge=test`;
    const req = new NextRequest(url);

    const response = handleMetaWhatsAppVerify(req);

    expect(response.status).toBe(200);
  });

  it("returns 403 when no verify token is configured", () => {
    delete process.env.META_WEBHOOK_VERIFY_TOKEN;
    delete process.env.WA_WEBHOOK_VERIFY_TOKEN;
    delete process.env.WEBHOOK_VERIFY_TOKEN;

    const url = `http://localhost:3000/api/webhooks/meta/whatsapp?hub.mode=subscribe&hub.verify_token=anything&hub.challenge=test`;
    const req = new NextRequest(url);

    const response = handleMetaWhatsAppVerify(req);

    // Token is "" (empty), so expected is empty → doesn't match
    expect(response.status).toBe(403);
  });
});

// ─── handleMetaWhatsAppWebhook (POST endpoint) ──────────────────────

describe("handleMetaWhatsAppWebhook", () => {
  const APP_SECRET = "test_app_secret_for_hmac";

  function createSignedRequest(body: string, secret?: string) {
    const s = secret ?? APP_SECRET;
    const hmac = createHmac("sha256", s).update(body, "utf-8").digest("hex");
    return new NextRequest("http://localhost:3000/api/webhooks/meta/whatsapp", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": `sha256=${hmac}`,
      },
    });
  }

  beforeEach(() => {
    process.env.META_APP_SECRET = APP_SECRET;
  });

  afterEach(() => {
    delete process.env.META_APP_SECRET;
  });

  it("returns 401 for invalid signature", async () => {
    const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const req = new NextRequest("http://localhost:3000/api/webhooks/meta/whatsapp", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": "sha256=invalid_signature_here",
      },
    });

    const response = await handleMetaWhatsAppWebhook(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.code).toBe("invalid_signature");
  });

  it("returns 401 when signature header is missing", async () => {
    const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const req = new NextRequest("http://localhost:3000/api/webhooks/meta/whatsapp", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });

    const response = await handleMetaWhatsAppWebhook(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.code).toBe("invalid_signature");
  });

  it("accepts valid signature with correct HMAC", async () => {
    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{
        id: "123456",
        changes: [{
          field: "messages",
          value: {
            metadata: { phone_number_id: "phone_123" },
            messages: [],
          },
        }],
      }],
    });

    const req = createSignedRequest(body);
    const response = await handleMetaWhatsAppWebhook(req);

    // Valid signature → should process (not 401)
    expect(response.status).not.toBe(401);
  });

  it("skips signature check when META_APP_SECRET is not set", async () => {
    delete process.env.META_APP_SECRET;

    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [],
    });

    const req = new NextRequest("http://localhost:3000/api/webhooks/meta/whatsapp", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });

    const response = await handleMetaWhatsAppWebhook(req);

    // No secret = skip verification, should not be 401
    expect(response.status).not.toBe(401);
  });

  it("returns 400 for empty body", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/meta/whatsapp", {
      method: "POST",
      body: "",
      headers: { "Content-Type": "application/json" },
    });

    // Without META_APP_SECRET, signature check passes
    delete process.env.META_APP_SECRET;

    const response = await handleMetaWhatsAppWebhook(req);

    // Empty body should be rejected
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    delete process.env.META_APP_SECRET;

    const body = "this is not json {{{";
    const req = new NextRequest("http://localhost:3000/api/webhooks/meta/whatsapp", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });

    const response = await handleMetaWhatsAppWebhook(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.code).toBe("invalid_payload");
  });

  it("returns 429 when rate limited", async () => {
    const { rateLimitDb } = await import("@/lib/rate-limit");
    vi.mocked(rateLimitDb).mockResolvedValueOnce({
      ok: false,
      resetAt: Date.now() + 60_000,
    } as never);

    const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const req = createSignedRequest(body);

    const response = await handleMetaWhatsAppWebhook(req);

    expect(response.status).toBe(429);
  });
});
