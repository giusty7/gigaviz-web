/**
 * Tests for lib/midtrans/client.ts
 *
 * Tests Midtrans client configuration, signature verification, type exports,
 * and API call behavior.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

// ─── Mock server-only ───────────────────────────────────────────────
vi.mock("server-only", () => ({}));

// ─── Store original env ─────────────────────────────────────────────
const originalEnv = { ...process.env };

// ─── Dynamic import to pick up env overrides ────────────────────────
// Because client.ts reads env at module scope, we need to reset modules per test group

describe("Midtrans Client", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("verifySignature", () => {
    it("returns true for a valid SHA-512 signature", async () => {
      // Set the server key that the module will use
      process.env.MIDTRANS_SERVER_KEY = "test-server-key-123";
      vi.resetModules();
      const { verifySignature } = await import("../midtrans/client");

      // Manually compute expected SHA-512
      const crypto = await import("crypto");
      const payload = "ORDER-001" + "200" + "150000.00" + "test-server-key-123";
      const expected = crypto.createHash("sha512").update(payload).digest("hex");

      expect(verifySignature("ORDER-001", "200", "150000.00", expected)).toBe(true);
    });

    it("returns false for an invalid signature", async () => {
      process.env.MIDTRANS_SERVER_KEY = "test-server-key-123";
      vi.resetModules();
      const { verifySignature } = await import("../midtrans/client");

      expect(
        verifySignature("ORDER-001", "200", "150000.00", "invalid-signature-hex")
      ).toBe(false);
    });

    it("returns false when server key differs", async () => {
      process.env.MIDTRANS_SERVER_KEY = "different-key";
      vi.resetModules();
      const { verifySignature } = await import("../midtrans/client");

      // Signature computed with a different key
      const crypto = await import("crypto");
      const payload = "ORDER-001" + "200" + "150000.00" + "original-key";
      const wrongSig = crypto.createHash("sha512").update(payload).digest("hex");

      expect(verifySignature("ORDER-001", "200", "150000.00", wrongSig)).toBe(false);
    });
  });

  describe("getMidtransConfig", () => {
    it("returns sandbox config when IS_PRODUCTION is not set", async () => {
      process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-test";
      process.env.MIDTRANS_CLIENT_KEY = "SB-Mid-client-test";
      delete process.env.MIDTRANS_IS_PRODUCTION;
      vi.resetModules();
      const { getMidtransConfig } = await import("../midtrans/client");

      const config = getMidtransConfig();
      expect(config.isProduction).toBe(false);
      expect(config.isConfigured).toBe(true);
      expect(config.snapUrl).toContain("sandbox");
      expect(config.coreApiUrl).toContain("sandbox");
      expect(config.serverKey).toBe("SB-Mid-server-test");
      expect(config.clientKey).toBe("SB-Mid-client-test");
    });

    it("returns production config when IS_PRODUCTION is true", async () => {
      process.env.MIDTRANS_SERVER_KEY = "Mid-server-prod";
      process.env.MIDTRANS_CLIENT_KEY = "Mid-client-prod";
      process.env.MIDTRANS_IS_PRODUCTION = "true";
      vi.resetModules();
      const { getMidtransConfig } = await import("../midtrans/client");

      const config = getMidtransConfig();
      expect(config.isProduction).toBe(true);
      expect(config.snapUrl).not.toContain("sandbox");
      expect(config.coreApiUrl).not.toContain("sandbox");
    });

    it("reports not configured when server key is empty", async () => {
      delete process.env.MIDTRANS_SERVER_KEY;
      delete process.env.MIDTRANS_CLIENT_KEY;
      vi.resetModules();
      const { getMidtransConfig } = await import("../midtrans/client");

      const config = getMidtransConfig();
      expect(config.isConfigured).toBe(false);
    });
  });

  describe("snapCreateTransaction", () => {
    it("throws when MIDTRANS_SERVER_KEY is not set", async () => {
      delete process.env.MIDTRANS_SERVER_KEY;
      vi.resetModules();
      const { snapCreateTransaction } = await import("../midtrans/client");

      await expect(
        snapCreateTransaction({
          transaction_details: { order_id: "TEST-001", gross_amount: 50000 },
        })
      ).rejects.toThrow("Midtrans is not configured");
    });

    it("calls Snap API with correct parameters", async () => {
      process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-test";
      vi.resetModules();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: "snap-token-123", redirect_url: "https://snap.midtrans.com/pay" }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const { snapCreateTransaction } = await import("../midtrans/client");

      const result = await snapCreateTransaction({
        transaction_details: { order_id: "TEST-001", gross_amount: 50000 },
        customer_details: { email: "test@example.com" },
      });

      expect(result.token).toBe("snap-token-123");
      expect(result.redirect_url).toContain("midtrans.com");
      expect(mockFetch).toHaveBeenCalledOnce();

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("snap/v1/transactions");
      expect(opts.method).toBe("POST");
      expect(opts.headers.Authorization).toMatch(/^Basic /);
    });

    it("throws on non-OK response", async () => {
      process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-test";
      vi.resetModules();

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad request"),
      }));

      const { snapCreateTransaction } = await import("../midtrans/client");

      await expect(
        snapCreateTransaction({
          transaction_details: { order_id: "TEST-001", gross_amount: 50000 },
        })
      ).rejects.toThrow("Midtrans Snap error 400");
    });
  });

  describe("getTransactionStatus", () => {
    it("returns transaction status from Core API", async () => {
      process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-test";
      vi.resetModules();

      const mockStatus = {
        transaction_id: "tx-123",
        order_id: "ORDER-001",
        transaction_status: "settlement",
        fraud_status: "accept",
        status_code: "200",
        gross_amount: "150000.00",
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      }));

      const { getTransactionStatus } = await import("../midtrans/client");

      const result = await getTransactionStatus("ORDER-001");
      expect(result.transaction_status).toBe("settlement");
      expect(result.order_id).toBe("ORDER-001");
    });

    it("throws on API error", async () => {
      process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-test";
      vi.resetModules();

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Transaction not found"),
      }));

      const { getTransactionStatus } = await import("../midtrans/client");

      await expect(getTransactionStatus("BAD-ORDER")).rejects.toThrow(
        "Midtrans status error 404"
      );
    });
  });

  describe("Type exports", () => {
    it("exports expected types from module", async () => {
      vi.resetModules();
      const mod = await import("../midtrans/client");

      // Verify function exports
      expect(typeof mod.verifySignature).toBe("function");
      expect(typeof mod.getMidtransConfig).toBe("function");
      expect(typeof mod.snapCreateTransaction).toBe("function");
      expect(typeof mod.getTransactionStatus).toBe("function");
    });
  });
});
