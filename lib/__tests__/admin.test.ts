import { describe, it, expect } from "vitest";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin";

describe("parseAdminEmails", () => {
  it("returns empty array when env is not set", () => {
    const original = process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAIL;
    const result = parseAdminEmails();
    expect(result).toEqual([]);
    process.env.ADMIN_EMAILS = original;
  });

  it("parses comma-separated emails", () => {
    const original = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@test.com, super@test.com";
    const result = parseAdminEmails();
    expect(result).toEqual(["admin@test.com", "super@test.com"]);
    process.env.ADMIN_EMAILS = original;
  });

  it("trims whitespace and lowercases", () => {
    const original = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "  ADMIN@TEST.COM  ";
    const result = parseAdminEmails();
    expect(result).toEqual(["admin@test.com"]);
    process.env.ADMIN_EMAILS = original;
  });
});

describe("isAdminEmail", () => {
  it("returns false for null/undefined email", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("returns false when no admin emails configured", () => {
    const original = process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAIL;
    // SECURITY: When ADMIN_EMAILS is empty, no one should be admin
    expect(isAdminEmail("random@test.com")).toBe(false);
    process.env.ADMIN_EMAILS = original;
  });

  it("returns true for listed admin email (case insensitive)", () => {
    const original = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@test.com";
    expect(isAdminEmail("ADMIN@TEST.COM")).toBe(true);
    expect(isAdminEmail("admin@test.com")).toBe(true);
    process.env.ADMIN_EMAILS = original;
  });

  it("returns false for unlisted email", () => {
    const original = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@test.com";
    expect(isAdminEmail("hacker@evil.com")).toBe(false);
    process.env.ADMIN_EMAILS = original;
  });
});
