/**
 * Tests for lib/app-modules.ts — Module catalog mapping and lookups
 */
import { describe, it, expect } from "vitest";
import { appModules, getAppModule, type AppModule } from "@/lib/app-modules";

describe("appModules", () => {
  it("exports a non-empty array", () => {
    expect(Array.isArray(appModules)).toBe(true);
    expect(appModules.length).toBeGreaterThan(0);
  });

  it("contains expected top-level modules", () => {
    const slugs = appModules.map((m) => m.slug);
    expect(slugs).toContain("platform");
    expect(slugs).toContain("meta-hub");
    expect(slugs).toContain("helper");
    expect(slugs).toContain("links");
  });

  describe.each(appModules)("module: $slug", (mod: AppModule) => {
    it("has required fields", () => {
      expect(mod.key).toBeTruthy();
      expect(mod.slug).toBeTruthy();
      expect(mod.name).toBeTruthy();
      expect(mod.description).toBeTruthy();
    });

    it("has valid availability", () => {
      expect(["available", "coming_soon"]).toContain(mod.availability);
    });

    it("has lockedTitle derived from name", () => {
      expect(mod.lockedTitle).toBe(`${mod.name} is locked`);
    });

    it("has lockedDescription", () => {
      expect(mod.lockedDescription).toBe("Upgrade your plan to unlock this module.");
    });

    it("has note for beta modules, undefined for others", () => {
      if (mod.status === "beta") {
        expect(mod.note).toBe("Beta status: subject to change.");
      } else {
        expect(mod.note).toBeUndefined();
      }
    });
  });
});

describe("getAppModule", () => {
  it("returns module by slug", () => {
    const mod = getAppModule("platform");
    expect(mod).toBeDefined();
    expect(mod?.slug).toBe("platform");
    expect(mod?.name).toContain("Platform");
  });

  it("returns module for meta-hub", () => {
    const mod = getAppModule("meta-hub");
    expect(mod).toBeDefined();
    expect(mod?.slug).toBe("meta-hub");
  });

  it("returns module for helper", () => {
    const mod = getAppModule("helper");
    expect(mod).toBeDefined();
    expect(mod?.slug).toBe("helper");
  });

  it("returns module for links", () => {
    const mod = getAppModule("links");
    expect(mod).toBeDefined();
    expect(mod?.slug).toBe("links");
  });

  it("returns undefined for non-existent slug", () => {
    const mod = getAppModule("nonexistent-module");
    expect(mod).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    const mod = getAppModule("");
    expect(mod).toBeUndefined();
  });
});
