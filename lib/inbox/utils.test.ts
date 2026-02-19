import { describe, it, expect } from "vitest";
import { fmtTime, clsx, badgeColor } from "@/lib/inbox/utils";

/* ── fmtTime ─────────────────────────────────────────────────── */
describe("fmtTime", () => {
  it("formats an ISO string to HH:MM in Asia/Jakarta timezone", () => {
    // 2026-01-15T10:30:00Z → WIB is UTC+7 → 17:30
    const result = fmtTime("2026-01-15T10:30:00.000Z");
    expect(result).toMatch(/17[.:]30/);
  });

  it("handles midnight UTC (07:00 WIB)", () => {
    const result = fmtTime("2026-06-01T00:00:00.000Z");
    expect(result).toMatch(/07[.:]00/);
  });

  it("handles end of day UTC (06:59 next day WIB)", () => {
    const result = fmtTime("2026-06-01T23:59:00.000Z");
    expect(result).toMatch(/06[.:]59/);
  });
});

/* ── clsx ────────────────────────────────────────────────────── */
describe("clsx", () => {
  it("joins string arguments with spaces", () => {
    expect(clsx("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("filters out false values", () => {
    expect(clsx("foo", false, "bar")).toBe("foo bar");
  });

  it("filters out undefined values", () => {
    expect(clsx("foo", undefined, "bar")).toBe("foo bar");
  });

  it("filters out null values", () => {
    expect(clsx("foo", null, "bar")).toBe("foo bar");
  });

  it("returns empty string when all values are falsy", () => {
    expect(clsx(false, undefined, null)).toBe("");
  });

  it("returns empty string with no arguments", () => {
    expect(clsx()).toBe("");
  });

  it("handles single string argument", () => {
    expect(clsx("foo")).toBe("foo");
  });

  it("handles mix of all falsy types", () => {
    expect(clsx("a", false, "b", null, "c", undefined)).toBe("a b c");
  });
});

/* ── badgeColor ──────────────────────────────────────────────── */
describe("badgeColor", () => {
  it("returns emerald classes for 'open'", () => {
    expect(badgeColor("open")).toContain("emerald");
  });

  it("returns amber classes for 'pending'", () => {
    expect(badgeColor("pending")).toContain("amber");
  });

  it("returns sky classes for 'solved'", () => {
    expect(badgeColor("solved")).toContain("sky");
  });

  it("returns rose classes for 'spam'", () => {
    expect(badgeColor("spam")).toContain("rose");
  });

  it("returns rose classes for 'urgent'", () => {
    expect(badgeColor("urgent")).toContain("rose");
  });

  it("returns amber classes for 'high'", () => {
    expect(badgeColor("high")).toContain("amber");
  });

  it("returns sky classes for 'med'", () => {
    expect(badgeColor("med")).toContain("sky");
  });

  it("returns slate classes for 'low'", () => {
    expect(badgeColor("low")).toContain("slate");
  });

  it("returns slate classes for unknown values", () => {
    expect(badgeColor("unknown")).toContain("slate");
    expect(badgeColor("")).toContain("slate");
    expect(badgeColor("random")).toContain("slate");
  });

  it("each badge color includes bg, text, and border classes", () => {
    for (const kind of ["open", "pending", "solved", "spam", "urgent", "high", "med", "low"]) {
      const classes = badgeColor(kind);
      expect(classes).toMatch(/bg-/);
      expect(classes).toMatch(/text-/);
      expect(classes).toMatch(/border-/);
    }
  });
});
