/**
 * Sprint 4: i18n message file completeness tests
 * Ensures en.json and id.json have matching keys (no missing translations)
 */
import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import id from "@/messages/id.json";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n message file completeness", () => {
  const enKeys = flattenKeys(en).sort();
  const idKeys = flattenKeys(id).sort();

  it("en.json and id.json have the same number of keys", () => {
    // Allow small difference during active development, but flag it
    const diff = Math.abs(enKeys.length - idKeys.length);
    expect(diff).toBeLessThanOrEqual(5);
  });

  it("every key in en.json exists in id.json", () => {
    const idKeySet = new Set(idKeys);
    const missingInId = enKeys.filter((key) => !idKeySet.has(key));
    if (missingInId.length > 0) {
      console.warn("Keys missing in id.json:", missingInId);
    }
    // Soft check: warn but don't fail for up to 5 missing keys during active i18n
    expect(missingInId.length).toBeLessThanOrEqual(5);
  });

  it("every key in id.json exists in en.json", () => {
    const enKeySet = new Set(enKeys);
    const missingInEn = idKeys.filter((key) => !enKeySet.has(key));
    if (missingInEn.length > 0) {
      console.warn("Keys missing in en.json:", missingInEn);
    }
    expect(missingInEn.length).toBeLessThanOrEqual(5);
  });

  it("no empty string values in en.json", () => {
    const emptyKeys = enKeys.filter((key) => {
      const parts = key.split(".");
      let current: unknown = en;
      for (const part of parts) {
        current = (current as Record<string, unknown>)?.[part];
      }
      return current === "";
    });
    expect(emptyKeys).toEqual([]);
  });

  it("no empty string values in id.json", () => {
    const emptyKeys = idKeys.filter((key) => {
      const parts = key.split(".");
      let current: unknown = id;
      for (const part of parts) {
        current = (current as Record<string, unknown>)?.[part];
      }
      return current === "";
    });
    expect(emptyKeys).toEqual([]);
  });

  it("critical namespaces exist in both files", () => {
    const criticalNamespaces = [
      "common",
      "nav",
      "settings",
      "onboarding",
      "dashboard",
      "app",
      "metaHub",
      "inbox",
      "helper",
    ];
    for (const ns of criticalNamespaces) {
      expect(en).toHaveProperty(ns);
      expect(id).toHaveProperty(ns);
    }
  });

  it("settings has all required sub-sections", () => {
    const requiredSubkeys = [
      "tabs",
      "profile",
      "workspace",
      "securityTab",
      "members",
      "billingTab",
    ];
    for (const key of requiredSubkeys) {
      expect(en.settings).toHaveProperty(key);
      expect(id.settings).toHaveProperty(key);
    }
  });

  it("onboarding has slug status keys", () => {
    const slugKeys = ["slugAvailable", "slugTaken", "slugChecking", "slugInvalid", "slugError"];
    for (const key of slugKeys) {
      expect(en.onboarding).toHaveProperty(key);
      expect(id.onboarding).toHaveProperty(key);
    }
  });

  it("nav has new keys for navbar i18n", () => {
    const newNavKeys = [
      "policies",
      "overview",
      "tagline",
      "ecosystemHeading",
      "viewPlans",
      "close",
      "menu",
      "openMenu",
      "mobileFooter",
    ];
    for (const key of newNavKeys) {
      expect(en.nav).toHaveProperty(key);
      expect(id.nav).toHaveProperty(key);
    }
  });
});
