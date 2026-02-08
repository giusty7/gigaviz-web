import { describe, it, expect } from "vitest";
import {
  products,
  productSlugs,
  productCategories,
  getProductBySlug,
  topLevelProducts,
} from "../products";

describe("products catalog", () => {
  it("has at least one product", () => {
    expect(products.length).toBeGreaterThan(0);
  });

  it("every product has required fields", () => {
    for (const p of products) {
      expect(p.slug).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.status).toMatch(/available|beta|coming/);
    }
  });

  it("productSlugs matches products array", () => {
    expect(productSlugs).toEqual(products.map((p) => p.slug));
  });

  it("productSlugs contains no duplicates", () => {
    const unique = new Set(productSlugs);
    expect(unique.size).toBe(productSlugs.length);
  });
});

describe("getProductBySlug", () => {
  it("returns product for valid slug", () => {
    const p = getProductBySlug("platform");
    expect(p).toBeDefined();
    expect(p?.slug).toBe("platform");
  });

  it("returns undefined for non-existent slug", () => {
    expect(getProductBySlug("nonexistent")).toBeUndefined();
  });

  it("returns correct product for meta-hub", () => {
    const p = getProductBySlug("meta-hub");
    expect(p).toBeDefined();
    expect(p?.name).toBeTruthy();
  });
});

describe("topLevelProducts", () => {
  it("is a non-empty array", () => {
    expect(topLevelProducts.length).toBeGreaterThan(0);
  });

  it("every product is also in the full products list", () => {
    for (const p of topLevelProducts) {
      expect(productSlugs).toContain(p.slug);
    }
  });
});

describe("productCategories", () => {
  it("is a non-empty sorted array", () => {
    expect(productCategories.length).toBeGreaterThan(0);
    const sorted = [...productCategories].sort();
    expect(productCategories).toEqual(sorted);
  });

  it("contains no duplicates", () => {
    const unique = new Set(productCategories);
    expect(unique.size).toBe(productCategories.length);
  });
});
