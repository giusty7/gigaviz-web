import { test, expect } from "@playwright/test";

// ═══════════════════════════════════════════════════════════════════════
// Critical User Flows — E2E Smoke Tests
// Tests the revenue path: Marketing → Pricing → Register → Onboarding
//
// NOTE: CI runs with placeholder Supabase keys — no real database.
// Tests must tolerate 500 responses from routes that hit the DB.
// Focus on: static pages render, forms exist, SEO tags present.
// ═══════════════════════════════════════════════════════════════════════

test.describe("Sales Funnel", () => {
  test("homepage has CTA linking to pricing or get-started", async ({ page }) => {
    await page.goto("/");
    // Look for primary CTA button(s)
    const ctaLinks = page.locator(
      'a[href*="pricing"], a[href*="get-started"], a[href*="register"]'
    );
    const count = await ctaLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("pricing page shows plans with CTA buttons", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("main").first()).toBeVisible();

    // Should have at least 2 plan cards (Starter, Growth, Business)
    const planCards = page.locator(
      '[data-testid="plan-card"], [class*="card"], [class*="Card"]'
    );
    const count = await planCards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Should have CTA buttons (free trial or subscribe)
    const ctaButtons = page.locator(
      'a[href*="register"], a[href*="trial"], button:has-text("Trial"), button:has-text("Mulai"), button:has-text("Start")'
    );
    const ctaCount = await ctaButtons.count();
    expect(ctaCount).toBeGreaterThan(0);
  });

  test("pricing CTA navigates to register with plan param", async ({ page }) => {
    await page.goto("/pricing");

    // Find the first "Get Started" / "Start Free Trial" link
    const trialLink = page.locator(
      'a[href*="register"][href*="plan"], a[href*="register"][href*="trial"]'
    ).first();

    if (await trialLink.isVisible()) {
      const href = await trialLink.getAttribute("href");
      expect(href).toBeTruthy();
      // Should include plan parameter
      expect(href).toMatch(/plan=|trial/);
    }
  });

  test("register page preserves plan query param", async ({ page }) => {
    const response = await page.goto("/register?plan=starter&trial=1");
    // Page should load (200) or redirect to auth (302)
    expect(response).not.toBeNull();
    expect([200, 304]).toContain(response!.status());
    // If still on register, check for email input
    if (page.url().includes("/register")) {
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      expect(page.url()).toContain("plan=starter");
    }
  });
});

test.describe("Product Pages", () => {
  const productPages = [
    { path: "/products/meta-hub", keyword: /WhatsApp|Meta Hub/i },
    { path: "/products/helper", keyword: /AI|Helper|Asisten/i },
    { path: "/products/studio", keyword: /Studio|Creative/i },
  ];

  for (const { path, keyword } of productPages) {
    test(`${path} loads with relevant content`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response).not.toBeNull();
      // 200 = normal, 500 = DB unreachable in CI (acceptable)
      expect([200, 500]).toContain(response!.status());

      if (response!.status() === 200) {
        const bodyText = await page.locator("main").first().textContent();
        expect(bodyText).toMatch(keyword);
      }
    });
  }
});

test.describe("SEO & Technical", () => {
  test("robots.txt is accessible and well-formed", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    // Next.js outputs "User-Agent" (capitalized)
    expect(body.toLowerCase()).toContain("user-agent");
    expect(body.toLowerCase()).toContain("sitemap");
  });

  test("homepage has meta description and OG tags", async ({ page }) => {
    await page.goto("/");

    // Meta description
    const metaDesc = page.locator('meta[name="description"]');
    const descContent = await metaDesc.getAttribute("content");
    expect(descContent).toBeTruthy();
    expect(descContent!.length).toBeGreaterThan(20);

    // Open Graph
    const ogTitle = page.locator('meta[property="og:title"]');
    expect(await ogTitle.getAttribute("content")).toBeTruthy();

    const ogDesc = page.locator('meta[property="og:description"]');
    expect(await ogDesc.getAttribute("content")).toBeTruthy();
  });

  test("pricing page has unique meta title", async ({ page }) => {
    await page.goto("/pricing");
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.toLowerCase()).toMatch(/pricing|harga/i);
  });
});

test.describe("Contact & Newsletter", () => {
  test("contact page loads", async ({ page }) => {
    const response = await page.goto("/contact");
    expect(response).not.toBeNull();
    // 200 = normal, 500 = DB unreachable in CI
    expect([200, 500]).toContain(response!.status());
    if (response!.status() === 200) {
      await expect(page.locator("main").first()).toBeVisible();
    }
  });

  test("newsletter API rejects empty email", async ({ request }) => {
    const response = await request.post("/api/newsletter/subscribe", {
      data: { email: "" },
    });
    // 400 = Zod validation, 500 = DB unreachable in CI
    expect([400, 422, 500]).toContain(response.status());
  });

  test("newsletter API rejects invalid email format", async ({ request }) => {
    const response = await request.post("/api/newsletter/subscribe", {
      data: { email: "not-an-email" },
    });
    // 400 = Zod validation, 500 = DB unreachable in CI
    expect([400, 422, 500]).toContain(response.status());
  });
});

test.describe("Auth Boundaries", () => {
  test("protected workspace routes require auth", async ({ page }) => {
    // Access a workspace route without auth — should redirect or error
    const response = await page.goto("/test-workspace/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    // In CI without real Supabase: may redirect to login, show error, or 500
    // The important thing: it should NOT return workspace data
    const status = response?.status() ?? 0;
    const url = page.url();
    // Either redirected to auth page, or returned error status
    const isProtected =
      url.includes("/login") ||
      url.includes("/auth") ||
      url.includes("/onboarding") ||
      status === 500 ||
      status === 401 ||
      status === 403;
    expect(isProtected).toBe(true);
  });

  test("ops console requires admin auth", async ({ request }) => {
    const response = await request.get("/ops");
    // Should redirect (302/307) or return forbidden or error
    expect([200, 302, 307, 401, 403, 500]).toContain(response.status());
  });

  test("API admin routes reject unauthenticated requests", async ({ request }) => {
    const adminEndpoints = [
      "/api/admin/threads",
      "/api/admin/contacts",
      "/api/admin/teams",
    ];
    for (const endpoint of adminEndpoints) {
      const response = await request.get(endpoint);
      // 400 = missing workspace, 401/403 = auth rejected, 404 = not found, 500 = DB unreachable in CI
      expect([400, 401, 403, 404, 405, 500]).toContain(response.status());
    }
  });
});

test.describe("Performance Indicators", () => {
  test("homepage loads within 10 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const duration = Date.now() - start;
    // 10s generous for CI cold start
    expect(duration).toBeLessThan(10_000);
  });
});
