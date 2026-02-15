/**
 * Tests for lib/hubs.ts — Hub definitions and data integrity
 */
import { describe, it, expect } from "vitest";
import { HUBS, type HubDef, type HubStatus } from "@/lib/hubs";

describe("HUBS catalog", () => {
  it("exports a non-empty array of hub definitions", () => {
    expect(Array.isArray(HUBS)).toBe(true);
    expect(HUBS.length).toBeGreaterThan(0);
  });

  it("contains all expected hub slugs", () => {
    const slugs = HUBS.map((h) => h.slug);
    expect(slugs).toContain("platform");
    expect(slugs).toContain("meta-hub");
    expect(slugs).toContain("helper");
    expect(slugs).toContain("links");
    expect(slugs).toContain("studio");
    expect(slugs).toContain("apps");
    expect(slugs).toContain("marketplace");
  });

  it("has 7 hubs total", () => {
    expect(HUBS).toHaveLength(7);
  });

  describe.each(HUBS)("hub: $slug", (hub: HubDef) => {
    it("has a valid slug", () => {
      expect(hub.slug).toBeTruthy();
      expect(typeof hub.slug).toBe("string");
      expect(hub.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    });

    it("has a non-empty title", () => {
      expect(hub.title).toBeTruthy();
      expect(hub.title.length).toBeGreaterThan(3);
    });

    it("has a non-empty description", () => {
      expect(hub.description).toBeTruthy();
      expect(hub.description.length).toBeGreaterThan(10);
    });

    it("has a valid status", () => {
      const validStatuses: HubStatus[] = ["OPEN", "COMING_SOON"];
      expect(validStatuses).toContain(hub.status);
    });

    it("has at least one flow step", () => {
      expect(Array.isArray(hub.flow)).toBe(true);
      expect(hub.flow.length).toBeGreaterThan(0);
    });

    it("has flow steps with title and desc", () => {
      for (const step of hub.flow) {
        expect(step.title).toBeTruthy();
        expect(step.desc).toBeTruthy();
      }
    });

    it("has at least one bullet point", () => {
      expect(Array.isArray(hub.bullets)).toBe(true);
      expect(hub.bullets.length).toBeGreaterThan(0);
    });

    it("has non-empty bullet text", () => {
      for (const bullet of hub.bullets) {
        expect(typeof bullet).toBe("string");
        expect(bullet.length).toBeGreaterThan(5);
      }
    });

    it("has all English content (no Indonesian)", () => {
      // Hubs should be English-only per the comment at top of file
      const allText = [
        hub.title,
        hub.description,
        ...hub.bullets,
        ...hub.flow.map((f) => `${f.title} ${f.desc}`),
      ].join(" ");
      // Check for common Indonesian words that shouldn't appear
      expect(allText).not.toMatch(/\b(dan|atau|untuk|dengan|dari|yang|ini|itu)\b/i);
    });
  });

  it("has unique slugs", () => {
    const slugs = HUBS.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has platform, meta-hub, and helper as OPEN", () => {
    const openSlugs = HUBS.filter((h) => h.status === "OPEN").map((h) => h.slug);
    expect(openSlugs).toContain("platform");
    expect(openSlugs).toContain("meta-hub");
    expect(openSlugs).toContain("helper");
  });
});
