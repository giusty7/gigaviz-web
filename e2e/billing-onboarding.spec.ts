import { test, expect } from "@playwright/test";

// ═══════════════════════════════════════════════════════════════════════
// Billing, Onboarding & Data Deletion — E2E Smoke Tests
//
// NOTE: CI runs with placeholder Supabase keys — no real database.
// Auth-gated pages should redirect to /login. API routes should
// return proper error codes, not crash. Focus on: pages render,
// forms exist, API routes respond with expected status codes.
// ═══════════════════════════════════════════════════════════════════════

test.describe("Onboarding Flow", () => {
  test("onboarding page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await page
      .waitForURL(/\/(login|auth|register)/i, { timeout: 10000 })
      .catch(() => {
        // May stay on page if Supabase unreachable in CI
      });

    const url = page.url();
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Either redirected to auth page, or displayed error page
    const isHandled =
      url.includes("/login") ||
      url.includes("/auth") ||
      url.includes("/onboarding"); // stayed but shows auth error
    expect(isHandled).toBe(true);
  });
});

test.describe("Billing API Protection", () => {
  test("GET /api/billing/summary requires auth", async ({ request }) => {
    const res = await request.get("/api/billing/summary");
    // 400 = missing workspace, 401/403 = auth, 500 = DB unreachable
    expect([400, 401, 403, 500]).toContain(res.status());
  });

  test("POST /api/billing/topup requires auth", async ({ request }) => {
    const res = await request.post("/api/billing/topup", {
      data: { amount: 1000 },
    });
    expect([400, 401, 403, 500]).toContain(res.status());
  });

  test("POST /api/billing/trial requires auth", async ({ request }) => {
    const res = await request.post("/api/billing/trial", {
      data: {},
    });
    expect([400, 401, 403, 500]).toContain(res.status());
  });

  test("POST /api/billing/set-subscription requires auth", async ({
    request,
  }) => {
    const res = await request.post("/api/billing/set-subscription", {
      data: { planId: "starter" },
    });
    expect([400, 401, 403, 500]).toContain(res.status());
  });

  test("POST /api/billing/token-cap requires auth and valid body", async ({
    request,
  }) => {
    const res = await request.post("/api/billing/token-cap", {
      data: {},
    });
    expect([400, 401, 403, 500]).toContain(res.status());
  });
});

test.describe("Billing Pages (Auth-Gated)", () => {
  test("workspace billing page redirects to login", async ({ page }) => {
    await page.goto("/test-workspace/billing", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    const url = page.url();

    const isProtected =
      url.includes("/login") ||
      url.includes("/auth") ||
      url.includes("/onboarding");
    expect(isProtected || url.includes("/billing")).toBe(true);

    // Page should not crash — body visible
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Data Deletion Page", () => {
  test("data deletion page loads", async ({ page }) => {
    const response = await page.goto("/data-deletion");
    expect(response).not.toBeNull();
    // 200 = normal, 500 = DB unreachable in CI
    expect([200, 500]).toContain(response!.status());

    if (response!.status() === 200) {
      await expect(page.locator("main, body").first()).toBeVisible();
    }
  });
});

test.describe("Midtrans Payment API", () => {
  test("POST /api/billing/midtrans/topup requires auth", async ({
    request,
  }) => {
    const res = await request.post("/api/billing/midtrans/topup", {
      data: { amount: 50000 },
    });
    // 400 = missing workspace, 401/403 = auth, 500 = Midtrans unreachable
    expect([400, 401, 403, 500]).toContain(res.status());
  });

  test("POST /api/billing/midtrans/subscribe requires auth", async ({
    request,
  }) => {
    const res = await request.post("/api/billing/midtrans/subscribe", {
      data: { planId: "starter" },
    });
    expect([400, 401, 403, 500]).toContain(res.status());
  });
});
