/**
 * Tests for lib/modules/catalog.ts — Module catalog data integrity and lookups
 */
import { describe, it, expect } from "vitest";
import {
  modulesCatalog,
  topLevelModules,
  studioChildren,
  getModuleBySlug,
  getModuleByKey,
  getTopLevelBySlug,
  getStudioChildBySlug,
  moduleStatusLabel,
  type ModuleCatalogItem,
} from "@/lib/modules/catalog";

describe("modulesCatalog", () => {
  it("exports a non-empty array", () => {
    expect(Array.isArray(modulesCatalog)).toBe(true);
    expect(modulesCatalog.length).toBeGreaterThan(0);
  });

  it("has at least 8 modules (including studio children)", () => {
    expect(modulesCatalog.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique keys", () => {
    const keys = modulesCatalog.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique slugs", () => {
    const slugs = modulesCatalog.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  describe.each(modulesCatalog)("module: $key", (mod: ModuleCatalogItem) => {
    it("has required string fields", () => {
      expect(mod.key).toBeTruthy();
      expect(mod.slug).toBeTruthy();
      expect(mod.name).toBeTruthy();
      expect(mod.description).toBeTruthy();
    });

    it("has a valid slug format (lowercase, hyphens)", () => {
      expect(mod.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    });

    it("has a valid status", () => {
      expect(["available", "beta", "coming"]).toContain(mod.status);
    });

    it("has a valid icon", () => {
      const validIcons = ["platform", "meta", "helper", "links", "office", "studio", "marketplace", "apps"];
      expect(validIcons).toContain(mod.icon);
    });

    it("has short description", () => {
      expect(mod.short).toBeTruthy();
    });
  });
});

describe("topLevelModules", () => {
  it("is a subset of modulesCatalog", () => {
    for (const mod of topLevelModules) {
      expect(modulesCatalog).toContain(mod);
    }
  });

  it("contains platform, meta-hub, helper, links", () => {
    const slugs = topLevelModules.map((m) => m.slug);
    expect(slugs).toContain("platform");
    expect(slugs).toContain("meta-hub");
    expect(slugs).toContain("helper");
    expect(slugs).toContain("links");
  });

  it("all have topLevel=true", () => {
    for (const mod of topLevelModules) {
      expect(mod.topLevel).toBe(true);
    }
  });
});

describe("studioChildren", () => {
  it("is a subset of modulesCatalog", () => {
    for (const mod of studioChildren) {
      expect(modulesCatalog).toContain(mod);
    }
  });

  it("all have parentKey=studio", () => {
    for (const mod of studioChildren) {
      expect(mod.parentKey).toBe("studio");
    }
  });

  it("includes office, graph, tracks", () => {
    const slugs = studioChildren.map((m) => m.slug);
    expect(slugs).toContain("office");
    expect(slugs).toContain("graph");
    expect(slugs).toContain("tracks");
  });
});

describe("moduleStatusLabel", () => {
  it("maps available to AVAILABLE", () => {
    expect(moduleStatusLabel.available).toBe("AVAILABLE");
  });

  it("maps beta to BETA", () => {
    expect(moduleStatusLabel.beta).toBe("BETA");
  });

  it("maps coming to COMING SOON", () => {
    expect(moduleStatusLabel.coming).toBe("COMING SOON");
  });
});

describe("getModuleBySlug", () => {
  it("finds platform by slug", () => {
    expect(getModuleBySlug("platform")?.key).toBe("platform");
  });

  it("finds meta-hub by slug", () => {
    expect(getModuleBySlug("meta-hub")?.key).toBe("meta_hub");
  });

  it("returns undefined for non-existent slug", () => {
    expect(getModuleBySlug("nonexistent")).toBeUndefined();
  });
});

describe("getModuleByKey", () => {
  it("finds platform by key", () => {
    expect(getModuleByKey("platform")?.slug).toBe("platform");
  });

  it("finds meta_hub by key", () => {
    expect(getModuleByKey("meta_hub")?.slug).toBe("meta-hub");
  });

  it("returns undefined for non-existent key", () => {
    expect(getModuleByKey("nonexistent")).toBeUndefined();
  });
});

describe("getTopLevelBySlug", () => {
  it("finds platform", () => {
    expect(getTopLevelBySlug("platform")?.key).toBe("platform");
  });

  it("does not find studio children", () => {
    expect(getTopLevelBySlug("office")).toBeUndefined();
    expect(getTopLevelBySlug("graph")).toBeUndefined();
    expect(getTopLevelBySlug("tracks")).toBeUndefined();
  });
});

describe("getStudioChildBySlug", () => {
  it("finds office", () => {
    expect(getStudioChildBySlug("office")?.key).toBe("office");
  });

  it("does not find top-level modules", () => {
    expect(getStudioChildBySlug("platform")).toBeUndefined();
  });
});
