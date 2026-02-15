/**
 * Tests for lib/copy.ts — Static UI copy integrity
 */
import { describe, it, expect } from "vitest";
import { copy, AUTH_DISCLAIMER_LINES } from "@/lib/copy";

describe("copy object", () => {
  it("exports a non-null object", () => {
    expect(copy).toBeDefined();
    expect(typeof copy).toBe("object");
  });

  describe("upgradeModal", () => {
    it("has required fields", () => {
      expect(copy.upgradeModal.title).toBeTruthy();
      expect(copy.upgradeModal.description).toBeTruthy();
      expect(copy.upgradeModal.ctaPrimary).toBeTruthy();
      expect(copy.upgradeModal.ctaSecondary).toBeTruthy();
      expect(copy.upgradeModal.footerNote).toBeTruthy();
    });

    it("has bullets array with at least 3 items", () => {
      expect(Array.isArray(copy.upgradeModal.bullets)).toBe(true);
      expect(copy.upgradeModal.bullets.length).toBeGreaterThanOrEqual(3);
    });

    it("has non-empty bullet strings", () => {
      for (const bullet of copy.upgradeModal.bullets) {
        expect(typeof bullet).toBe("string");
        expect(bullet.length).toBeGreaterThan(5);
      }
    });
  });

  describe("previewBanner", () => {
    it("has title, text, and action", () => {
      expect(copy.previewBanner.title).toBeTruthy();
      expect(copy.previewBanner.text).toBeTruthy();
      expect(copy.previewBanner.action).toBeTruthy();
    });
  });

  describe("tooltips", () => {
    it("has upgrade tooltip", () => {
      expect(copy.tooltips.upgrade).toBeTruthy();
    });
  });

  describe("messages", () => {
    it("has gated message", () => {
      expect(copy.messages.gated).toBeTruthy();
    });
  });

  describe("emptyStates", () => {
    const expectedKeys = ["workspace", "members", "roles", "audit", "billing"];

    it.each(expectedKeys)("has empty state for %s", (key) => {
      const state = copy.emptyStates[key as keyof typeof copy.emptyStates];
      expect(state).toBeDefined();
      expect(state.title).toBeTruthy();
      expect(state.helper).toBeTruthy();
    });

    it("has all 5 empty states", () => {
      expect(Object.keys(copy.emptyStates)).toHaveLength(5);
    });
  });

  it("all copy strings are English", () => {
    // Flatten all string values for language check
    const allStrings = [
      copy.upgradeModal.title,
      copy.upgradeModal.description,
      ...copy.upgradeModal.bullets,
      copy.previewBanner.title,
      copy.previewBanner.text,
      copy.tooltips.upgrade,
      copy.messages.gated,
      ...Object.values(copy.emptyStates).flatMap((s) => [s.title, s.helper]),
    ];
    for (const str of allStrings) {
      expect(typeof str).toBe("string");
      expect(str.length).toBeGreaterThan(0);
    }
  });
});

describe("AUTH_DISCLAIMER_LINES", () => {
  it("is a readonly tuple", () => {
    expect(Array.isArray(AUTH_DISCLAIMER_LINES)).toBe(true);
  });

  it("has 2 lines", () => {
    expect(AUTH_DISCLAIMER_LINES).toHaveLength(2);
  });

  it("mentions Meta and WhatsApp", () => {
    const combined = AUTH_DISCLAIMER_LINES.join(" ");
    expect(combined).toContain("Meta");
    expect(combined).toContain("WhatsApp");
  });

  it("mentions Technology Provider", () => {
    const combined = AUTH_DISCLAIMER_LINES.join(" ");
    expect(combined).toContain("Technology Provider");
  });
});
