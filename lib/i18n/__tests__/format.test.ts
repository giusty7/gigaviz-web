import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
} from "@/lib/i18n/format";

describe("formatNumber", () => {
  it("formats with English locale (comma separator)", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
  });

  it("formats with Indonesian locale (dot separator)", () => {
    expect(formatNumber(1234567, "id")).toBe("1.234.567");
  });

  it("handles zero", () => {
    expect(formatNumber(0, "en")).toBe("0");
  });

  it("handles negative numbers", () => {
    const result = formatNumber(-1000, "en");
    expect(result).toContain("1,000");
  });
});

describe("formatCurrency", () => {
  it("formats USD for English locale", () => {
    const result = formatCurrency(299000, "en");
    expect(result).toContain("$");
    expect(result).toContain("299,000");
  });

  it("formats IDR for Indonesian locale", () => {
    const result = formatCurrency(299000, "id");
    expect(result).toContain("Rp");
  });

  it("allows currency override", () => {
    const result = formatCurrency(100, "en", "EUR");
    expect(result).toContain("€");
  });

  it("formats zero correctly", () => {
    const result = formatCurrency(0, "en");
    expect(result).toContain("$");
  });
});

describe("formatDate", () => {
  it("formats date in English locale", () => {
    const result = formatDate("2026-02-09T12:00:00Z", "en");
    expect(result).toContain("Feb");
    expect(result).toContain("2026");
  });

  it("formats date in Indonesian locale", () => {
    const result = formatDate("2026-02-09T12:00:00Z", "id");
    expect(result).toContain("Feb");
    expect(result).toContain("2026");
  });

  it("returns empty string for null", () => {
    expect(formatDate(null, "en")).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined, "en")).toBe("");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDate("not-a-date", "en")).toBe("");
  });

  it("accepts Date object", () => {
    const result = formatDate(new Date("2026-02-09"), "en");
    expect(result).toContain("2026");
  });
});

describe("formatDateTime", () => {
  it("includes time in English format", () => {
    const result = formatDateTime("2026-02-09T14:30:00Z", "en");
    expect(result).toContain("Feb");
    expect(result).toContain("2026");
  });

  it("returns empty for null", () => {
    expect(formatDateTime(null, "en")).toBe("");
  });
});

describe("formatPercent", () => {
  it("formats percentage in English", () => {
    expect(formatPercent(85, "en")).toBe("85%");
  });

  it("formats percentage in Indonesian", () => {
    expect(formatPercent(85, "id")).toBe("85%");
  });

  it("formats zero percent", () => {
    expect(formatPercent(0, "en")).toBe("0%");
  });

  it("formats 100 percent", () => {
    expect(formatPercent(100, "en")).toBe("100%");
  });
});
