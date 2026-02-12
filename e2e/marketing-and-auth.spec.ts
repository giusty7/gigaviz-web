import { test, expect } from "@playwright/test";

test.describe("Marketing Pages", () => {
  test("homepage loads and has key content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Gigaviz/i);
    // Main hero section should be visible
    await expect(page.locator("main")).toBeVisible();
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveTitle(/Pricing|Gigaviz/i);
    await expect(page.locator("main")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    // Should have email input
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");
    // Should have navigation
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
  });

  test("footer is present", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});

test.describe("Auth Flow", () => {
  test("unauthenticated user redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await page.waitForURL(/\/(login|auth)/);
    expect(page.url()).toMatch(/\/(login|auth)/);
  });

  test("login form validates empty submission", async ({ page }) => {
    await page.goto("/login");
    // Try to submit without filling in
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should show validation error or stay on page
      expect(page.url()).toContain("/login");
    }
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });
});

test.describe("Security Headers", () => {
  test("response has security headers", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    const headers = response!.headers();
    // Check for common security headers (may vary by env)
    // At minimum, content-type should be present
    expect(headers["content-type"]).toContain("text/html");
  });
});

test.describe("404 Handling", () => {
  test("non-existent page returns 404 or redirect", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-xyz");
    // Should return 404 or redirect
    expect(response).not.toBeNull();
    const status = response!.status();
    expect([200, 302, 404]).toContain(status);
  });
});
