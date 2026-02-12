/**
 * Tests for lib/i18n/format.ts — locale-aware formatting utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatNumber,
  formatCurrency,
  formatRelativeTimeLocale,
  formatDate,
  formatDateTime,
  formatPercent,
} from "@/lib/i18n/format";

/* ------------------------------------------------------------------ */
/*  formatNumber                                                       */
/* ------------------------------------------------------------------ */
describe("formatNumber", () => {
  it("formats positive integers for en", () => {
    expect(formatNumber(1000, "en")).toBe("1,000");
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
  });

  it("formats positive integers for id", () => {
    expect(formatNumber(1000, "id")).toBe("1.000");
    expect(formatNumber(1234567, "id")).toBe("1.234.567");
  });

  it("formats zero", () => {
    expect(formatNumber(0, "en")).toBe("0");
    expect(formatNumber(0, "id")).toBe("0");
  });

  it("formats negative numbers", () => {
    const en = formatNumber(-500, "en");
    expect(en).toContain("500");
  });

  it("formats decimals", () => {
    const result = formatNumber(3.14, "en");
    expect(result).toContain("3");
  });
});

/* ------------------------------------------------------------------ */
/*  formatCurrency                                                     */
/* ------------------------------------------------------------------ */
describe("formatCurrency", () => {
  it("defaults to USD for en locale", () => {
    const result = formatCurrency(1000, "en");
    expect(result).toContain("1,000");
    expect(result).toMatch(/\$|USD/);
  });

  it("defaults to IDR for id locale", () => {
    const result = formatCurrency(50000, "id");
    expect(result).toContain("50.000");
    expect(result).toMatch(/Rp|IDR/);
  });

  it("allows custom currency override", () => {
    const result = formatCurrency(100, "en", "EUR");
    expect(result).toMatch(/€|EUR/);
  });

  it("formats zero amount", () => {
    const result = formatCurrency(0, "en");
    expect(result).toContain("0");
  });

  it("formats large amounts", () => {
    const result = formatCurrency(1000000, "id");
    expect(result).toContain("1.000.000");
  });
});

/* ------------------------------------------------------------------ */
/*  formatRelativeTimeLocale                                            */
/* ------------------------------------------------------------------ */
describe("formatRelativeTimeLocale", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for null/undefined", () => {
    expect(formatRelativeTimeLocale(null, "en")).toBe("");
    expect(formatRelativeTimeLocale(undefined, "en")).toBe("");
  });

  it("returns empty string for invalid date string", () => {
    expect(formatRelativeTimeLocale("not-a-date", "en")).toBe("");
  });

  it("formats seconds ago", () => {
    const date = new Date("2026-02-15T11:59:30Z");
    const result = formatRelativeTimeLocale(date, "en");
    expect(result).toMatch(/30 seconds? ago|second/i);
  });

  it("formats minutes ago", () => {
    const date = new Date("2026-02-15T11:55:00Z");
    const result = formatRelativeTimeLocale(date, "en");
    expect(result).toMatch(/5 minutes? ago|minute/i);
  });

  it("formats hours ago", () => {
    const date = new Date("2026-02-15T09:00:00Z");
    const result = formatRelativeTimeLocale(date, "en");
    expect(result).toMatch(/3 hours? ago|hour/i);
  });

  it("formats days ago", () => {
    const date = new Date("2026-02-13T12:00:00Z");
    const result = formatRelativeTimeLocale(date, "en");
    expect(result).toMatch(/2 days? ago|day/i);
  });

  it("falls back to date format for >30 days", () => {
    const date = new Date("2025-12-01T12:00:00Z");
    const result = formatRelativeTimeLocale(date, "en");
    // Should be a formatted date, not a relative time
    expect(result).toMatch(/Dec|2025|12/);
  });

  it("accepts ISO string input", () => {
    const result = formatRelativeTimeLocale("2026-02-15T11:55:00Z", "en");
    expect(result).toMatch(/5 minutes? ago|minute/i);
  });

  it("works with id locale", () => {
    const date = new Date("2026-02-15T11:55:00Z");
    const result = formatRelativeTimeLocale(date, "id");
    expect(result).toMatch(/menit|lalu/i);
  });
});

/* ------------------------------------------------------------------ */
/*  formatDate                                                          */
/* ------------------------------------------------------------------ */
describe("formatDate", () => {
  it("returns empty string for null/undefined", () => {
    expect(formatDate(null, "en")).toBe("");
    expect(formatDate(undefined, "en")).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDate("invalid", "en")).toBe("");
  });

  it("formats Date object in en locale", () => {
    const date = new Date("2026-02-15T12:00:00Z");
    const result = formatDate(date, "en");
    expect(result).toMatch(/Feb/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
  });

  it("formats Date object in id locale", () => {
    const date = new Date("2026-02-15T12:00:00Z");
    const result = formatDate(date, "id");
    expect(result).toMatch(/Feb/);
    expect(result).toMatch(/2026/);
  });

  it("accepts ISO string input", () => {
    const result = formatDate("2026-01-01T00:00:00Z", "en");
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2026/);
  });

  it("supports custom options", () => {
    const date = new Date("2026-02-15T12:00:00Z");
    const result = formatDate(date, "en", { dateStyle: "full" });
    expect(result).toMatch(/February/);
  });
});

/* ------------------------------------------------------------------ */
/*  formatDateTime                                                      */
/* ------------------------------------------------------------------ */
describe("formatDateTime", () => {
  it("returns empty string for null", () => {
    expect(formatDateTime(null, "en")).toBe("");
  });

  it("includes both date and time", () => {
    const date = new Date("2026-02-15T14:30:00Z");
    const result = formatDateTime(date, "en");
    expect(result).toMatch(/Feb/);
    expect(result).toMatch(/15/);
    // Should contain time portion
    expect(result.length).toBeGreaterThan(10);
  });

  it("works with id locale", () => {
    const date = new Date("2026-02-15T14:30:00Z");
    const result = formatDateTime(date, "id");
    expect(result).toMatch(/Feb|2026/);
  });
});

/* ------------------------------------------------------------------ */
/*  formatPercent                                                       */
/* ------------------------------------------------------------------ */
describe("formatPercent", () => {
  it("formats 50 as 50%", () => {
    const result = formatPercent(50, "en");
    expect(result).toContain("50");
    expect(result).toContain("%");
  });

  it("formats 0 as 0%", () => {
    const result = formatPercent(0, "en");
    expect(result).toContain("0");
    expect(result).toContain("%");
  });

  it("formats 100 as 100%", () => {
    const result = formatPercent(100, "en");
    expect(result).toContain("100");
    expect(result).toContain("%");
  });

  it("handles fractional values", () => {
    const result = formatPercent(33.33, "en");
    expect(result).toContain("33");
    expect(result).toContain("%");
  });

  it("works with id locale", () => {
    const result = formatPercent(75, "id");
    expect(result).toContain("75");
    expect(result).toContain("%");
  });
});
