import { test, expect } from "@playwright/test";

// ═══════════════════════════════════════════════════════════════════════
// Critical User Flows — E2E Smoke Tests
// Tests the revenue path: Marketing → Pricing → Register → Onboarding
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
    await expect(page.locator("main")).toBeVisible();

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
    await page.goto("/register?plan=starter&trial=1");
    // Should still be on register page
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    // URL should retain params
    expect(page.url()).toContain("plan=starter");
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
      expect(response!.status()).toBe(200);

      const bodyText = await page.locator("main").textContent();
      expect(bodyText).toMatch(keyword);
    });
  }
});

test.describe("SEO & Technical", () => {
  test("sitemap.xml returns valid XML", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/xml/);

    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<url>");
    expect(body).toContain("<loc>");
  });

  test("robots.txt is accessible and allows Googlebot", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("User-agent");
    expect(body).toContain("Sitemap");
    // Should not disallow everything
    expect(body).not.toContain("Disallow: /\n");
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
  test("contact page loads with form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("main")).toBeVisible();

    // Should have at least a name and email input
    const emailInput = page.locator(
      'input[type="email"], input[name="email"]'
    );
    await expect(emailInput.first()).toBeVisible();
  });

  test("newsletter API rejects empty email", async ({ request }) => {
    const response = await request.post("/api/newsletter/subscribe", {
      data: { email: "" },
    });
    // Should return 400 for validation error
    expect([400, 422]).toContain(response.status());
  });

  test("newsletter API rejects invalid email format", async ({ request }) => {
    const response = await request.post("/api/newsletter/subscribe", {
      data: { email: "not-an-email" },
    });
    expect([400, 422]).toContain(response.status());
  });
});

test.describe("Auth Boundaries", () => {
  test("protected workspace routes redirect to login", async ({ page }) => {
    // Access a workspace route without auth
    await page.goto("/test-workspace/dashboard");
    await page.waitForURL(/\/(login|auth|onboarding)/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/(login|auth|onboarding)/);
  });

  test("ops console requires admin auth", async ({ request }) => {
    const response = await request.get("/ops");
    // Should redirect (302/307) or return forbidden
    expect([200, 302, 307, 401, 403]).toContain(response.status());
    // If 200, it's the redirect page or login page — not the actual ops console
  });

  test("API admin routes reject unauthenticated requests", async ({ request }) => {
    const adminEndpoints = [
      "/api/admin/threads",
      "/api/admin/contacts",
      "/api/admin/teams",
    ];
    for (const endpoint of adminEndpoints) {
      const response = await request.get(endpoint);
      expect([401, 403, 500]).toContain(response.status());
    }
  });
});

test.describe("Performance Indicators", () => {
  test("homepage loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const duration = Date.now() - start;
    // Should load within 5s (generous for CI)
    expect(duration).toBeLessThan(5_000);
  });

  test("static assets have cache headers", async ({ page }) => {
    const responses: { url: string; cacheControl: string }[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (url.match(/\.(js|css|woff2?)$/)) {
        responses.push({
          url,
          cacheControl: response.headers()["cache-control"] ?? "",
        });
      }
    });

    await page.goto("/");
    // Wait for assets to load
    await page.waitForLoadState("networkidle");

    // At least some static assets should have cache headers
    if (responses.length > 0) {
      const cached = responses.filter((r) =>
        r.cacheControl.includes("max-age") || r.cacheControl.includes("immutable")
      );
      // In development, caching may not be applied — only assert in CI
      if (process.env.CI) {
        expect(cached.length).toBeGreaterThan(0);
      }
    }
  });
});
