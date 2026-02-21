/**
 * Tests for lib/xendit/client.ts
 *
 * Tests Xendit client configuration, webhook token verification,
 * type exports, and API call behavior.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: vi.fn() }),
}));

vi.mock("@/lib/logging", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/quotas", () => ({
  seedWorkspaceQuotas: vi.fn(),
}));

vi.mock("@/lib/billing/topup", () => ({
  settlePaymentIntentPaid: vi.fn(),
}));

vi.mock("@/lib/billing/emails", () => ({
  sendBillingEmail: vi.fn(),
}));

// ─── Store original env ─────────────────────────────────────────────
const originalEnv = { ...process.env };

describe("Xendit Client", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("verifyWebhookToken", () => {
    it("returns true for a matching callback token", async () => {
      process.env.XENDIT_WEBHOOK_TOKEN = "xnd-webhook-secret-abc";
      vi.resetModules();
      const { verifyWebhookToken } = await import("../xendit/client");

      expect(verifyWebhookToken("xnd-webhook-secret-abc")).toBe(true);
    });

    it("returns false for a non-matching callback token", async () => {
      process.env.XENDIT_WEBHOOK_TOKEN = "xnd-webhook-secret-abc";
      vi.resetModules();
      const { verifyWebhookToken } = await import("../xendit/client");

      expect(verifyWebhookToken("wrong-token")).toBe(false);
    });

    it("throws when webhook token is not configured", async () => {
      delete process.env.XENDIT_WEBHOOK_TOKEN;
      process.env.XENDIT_SECRET_KEY = "test-key";
      vi.resetModules();
      const { verifyWebhookToken } = await import("../xendit/client");

      expect(() => verifyWebhookToken("any-token")).toThrow(
        "Xendit webhook token not configured"
      );
    });
  });

  describe("getXenditConfig", () => {
    it("returns configured state when secret key is set", async () => {
      process.env.XENDIT_SECRET_KEY = "xnd_development_abc123";
      process.env.XENDIT_WEBHOOK_TOKEN = "webhook-token-xyz";
      process.env.NEXT_PUBLIC_XENDIT_ENABLED = "1";
      vi.resetModules();
      const { getXenditConfig } = await import("../xendit/client");

      const config = getXenditConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.isEnabled).toBe(true);
      expect(config.secretKey).toBe("xnd_development_abc123");
      expect(config.webhookToken).toBe("webhook-token-xyz");
    });

    it("reports not configured when secret key is empty", async () => {
      delete process.env.XENDIT_SECRET_KEY;
      delete process.env.XENDIT_WEBHOOK_TOKEN;
      vi.resetModules();
      const { getXenditConfig } = await import("../xendit/client");

      const config = getXenditConfig();
      expect(config.isConfigured).toBe(false);
    });

    it("reports disabled when NEXT_PUBLIC_XENDIT_ENABLED is not 1", async () => {
      process.env.XENDIT_SECRET_KEY = "xnd_key";
      delete process.env.NEXT_PUBLIC_XENDIT_ENABLED;
      vi.resetModules();
      const { getXenditConfig } = await import("../xendit/client");

      const config = getXenditConfig();
      expect(config.isEnabled).toBe(false);
    });
  });

  describe("createInvoice", () => {
    it("throws when XENDIT_SECRET_KEY is not set", async () => {
      delete process.env.XENDIT_SECRET_KEY;
      vi.resetModules();
      const { createInvoice } = await import("../xendit/client");

      await expect(
        createInvoice({
          external_id: "TEST-001",
          amount: 149000,
          currency: "IDR",
        })
      ).rejects.toThrow("Xendit is not configured");
    });

    it("calls Invoice API with correct parameters", async () => {
      process.env.XENDIT_SECRET_KEY = "xnd_development_test123";
      vi.resetModules();

      const mockResponse = {
        id: "inv_abc123",
        external_id: "XND-SUB-STARTER-NEW-12345678-1700000000",
        user_id: "user_123",
        status: "PENDING",
        merchant_name: "Gigaviz",
        amount: 149000,
        currency: "IDR",
        payer_email: "test@example.com",
        description: "Gigaviz Starter Plan (Monthly)",
        invoice_url: "https://checkout.xendit.co/web/inv_abc123",
        expiry_date: "2026-02-10T00:00:00.000Z",
        created: "2026-02-09T00:00:00.000Z",
        updated: "2026-02-09T00:00:00.000Z",
        merchant_profile_picture_url: "",
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      vi.stubGlobal("fetch", mockFetch);

      const { createInvoice } = await import("../xendit/client");

      const result = await createInvoice({
        external_id: "XND-SUB-STARTER-NEW-12345678-1700000000",
        amount: 149000,
        currency: "IDR",
        payer_email: "test@example.com",
        description: "Gigaviz Starter Plan (Monthly)",
      });

      expect(result.id).toBe("inv_abc123");
      expect(result.invoice_url).toContain("xendit.co");
      expect(result.status).toBe("PENDING");
      expect(mockFetch).toHaveBeenCalledOnce();

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/v2/invoices");
      expect(opts.method).toBe("POST");
      expect(opts.headers.Authorization).toMatch(/^Basic /);
      expect(opts.headers["Content-Type"]).toBe("application/json");
    });

    it("sends correct Basic Auth header", async () => {
      process.env.XENDIT_SECRET_KEY = "xnd_test_key";
      vi.resetModules();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "inv_1",
            invoice_url: "https://checkout.xendit.co/web/inv_1",
            external_id: "TEST",
            user_id: "u",
            status: "PENDING",
            merchant_name: "T",
            amount: 100,
            currency: "IDR",
            payer_email: "",
            description: "",
            expiry_date: "",
            created: "",
            updated: "",
            merchant_profile_picture_url: "",
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const { createInvoice } = await import("../xendit/client");
      await createInvoice({ external_id: "TEST", amount: 100 });

      const [, opts] = mockFetch.mock.calls[0];
      // Xendit uses secret_key + ":" encoded in base64
      const expectedAuth = `Basic ${Buffer.from("xnd_test_key:").toString("base64")}`;
      expect(opts.headers.Authorization).toBe(expectedAuth);
    });

    it("throws on non-OK response", async () => {
      process.env.XENDIT_SECRET_KEY = "xnd_test_key";
      vi.resetModules();

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          text: () => Promise.resolve("INVALID_AMOUNT"),
        })
      );

      const { createInvoice } = await import("../xendit/client");

      await expect(
        createInvoice({ external_id: "TEST", amount: -1 })
      ).rejects.toThrow("Xendit Invoice error 400");
    });
  });

  describe("getInvoiceStatus", () => {
    it("returns invoice status from API", async () => {
      process.env.XENDIT_SECRET_KEY = "xnd_test_key";
      vi.resetModules();

      const mockInvoice = {
        id: "inv_abc123",
        external_id: "XND-SUB-STARTER-NEW-12345678-1700000000",
        user_id: "user_123",
        status: "PAID",
        merchant_name: "Gigaviz",
        amount: 149000,
        currency: "IDR",
        payer_email: "test@example.com",
        description: "Gigaviz Starter Plan (Monthly)",
        invoice_url: "https://checkout.xendit.co/web/inv_abc123",
        expiry_date: "2026-02-10T00:00:00.000Z",
        created: "2026-02-09T00:00:00.000Z",
        updated: "2026-02-09T01:00:00.000Z",
        merchant_profile_picture_url: "",
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockInvoice),
        })
      );

      const { getInvoiceStatus } = await import("../xendit/client");

      const result = await getInvoiceStatus("inv_abc123");
      expect(result.status).toBe("PAID");
      expect(result.id).toBe("inv_abc123");
    });

    it("throws on API error", async () => {
      process.env.XENDIT_SECRET_KEY = "xnd_test_key";
      vi.resetModules();

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          text: () => Promise.resolve("Invoice not found"),
        })
      );

      const { getInvoiceStatus } = await import("../xendit/client");

      await expect(getInvoiceStatus("inv_bad")).rejects.toThrow(
        "Xendit status error 404"
      );
    });
  });

  describe("Type exports", () => {
    it("exports expected functions from module", async () => {
      process.env.XENDIT_SECRET_KEY = "test";
      process.env.XENDIT_WEBHOOK_TOKEN = "test";
      vi.resetModules();
      const mod = await import("../xendit/client");

      expect(typeof mod.getXenditConfig).toBe("function");
      expect(typeof mod.createInvoice).toBe("function");
      expect(typeof mod.getInvoiceStatus).toBe("function");
      expect(typeof mod.verifyWebhookToken).toBe("function");
    });
  });

  describe("Pricing & Packages (barrel export)", () => {
    it("exports plan prices with all currencies and intervals", async () => {
      vi.resetModules();
      const { XENDIT_PLAN_PRICES } = await import("../xendit/invoice");

      expect(XENDIT_PLAN_PRICES).toBeDefined();

      for (const plan of ["starter", "growth", "business"]) {
        const p = XENDIT_PLAN_PRICES[plan];
        expect(p).toBeDefined();
        expect(p.name).toBeTruthy();

        for (const cur of ["idr", "usd", "sgd"] as const) {
          expect(p[cur].monthly).toBeGreaterThan(0);
          expect(p[cur].yearly).toBeGreaterThan(0);
          // Yearly should be less than 12 × monthly (discount)
          expect(p[cur].yearly).toBeLessThan(p[cur].monthly * 12);
        }
      }
    });

    it("exports token packages with all currencies", async () => {
      vi.resetModules();
      const { XENDIT_TOKEN_PACKAGES } = await import("../xendit/invoice");

      expect(XENDIT_TOKEN_PACKAGES).toBeDefined();

      for (const pkgId of ["pkg_50k", "pkg_100k", "pkg_500k"]) {
        const pkg = XENDIT_TOKEN_PACKAGES[pkgId];
        expect(pkg).toBeDefined();
        expect(pkg.tokens).toBeGreaterThan(0);
        expect(pkg.label).toBeTruthy();
        expect(pkg.idr).toBeGreaterThan(0);
        expect(pkg.usd).toBeGreaterThan(0);
        expect(pkg.sgd).toBeGreaterThan(0);
      }
    });

    it("bonus packages have more tokens than base", async () => {
      vi.resetModules();
      const { XENDIT_TOKEN_PACKAGES } = await import("../xendit/invoice");

      // pkg_50k: 50,000 tokens (base)
      expect(XENDIT_TOKEN_PACKAGES.pkg_50k.tokens).toBe(50_000);
      // pkg_100k: 105,000 tokens (5k bonus)
      expect(XENDIT_TOKEN_PACKAGES.pkg_100k.tokens).toBeGreaterThan(100_000);
      // pkg_500k: 550,000 tokens (50k bonus)
      expect(XENDIT_TOKEN_PACKAGES.pkg_500k.tokens).toBeGreaterThan(500_000);
    });

    it("barrel export re-exports all public symbols", async () => {
      vi.resetModules();
      const barrel = await import("../xendit/index");

      // Client exports
      expect(typeof barrel.getXenditConfig).toBe("function");
      expect(typeof barrel.createInvoice).toBe("function");
      expect(typeof barrel.getInvoiceStatus).toBe("function");
      expect(typeof barrel.verifyWebhookToken).toBe("function");

      // Invoice exports
      expect(typeof barrel.createXenditSubscriptionInvoice).toBe("function");
      expect(typeof barrel.createXenditTokenTopupInvoice).toBe("function");
      expect(barrel.XENDIT_PLAN_PRICES).toBeDefined();
      expect(barrel.XENDIT_TOKEN_PACKAGES).toBeDefined();

      // Webhook exports
      expect(typeof barrel.handleXenditWebhookEvent).toBe("function");
    });
  });
});
