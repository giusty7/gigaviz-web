import { describe, it, expect } from "vitest";
import { identityFallback, GV_SYSTEM_PROMPT } from "@/lib/helper/persona";

/* ── GV_SYSTEM_PROMPT ────────────────────────────────────────── */
describe("GV_SYSTEM_PROMPT", () => {
  it("is defined and non-empty", () => {
    expect(GV_SYSTEM_PROMPT).toBeTruthy();
    expect(GV_SYSTEM_PROMPT.length).toBeGreaterThan(50);
  });

  it("contains Gigaviz identity", () => {
    expect(GV_SYSTEM_PROMPT).toContain("Gigaviz");
  });

  it("mentions Giusty as creator", () => {
    expect(GV_SYSTEM_PROMPT).toContain("Giusty");
  });
});

/* ── identityFallback ────────────────────────────────────────── */
describe("identityFallback", () => {
  describe("name patterns", () => {
    it('responds to "siapa namamu"', () => {
      expect(identityFallback("siapa namamu")).toBe("Aku Gigaviz.");
    });

    it('responds to "apa nama kamu"', () => {
      expect(identityFallback("apa nama kamu")).toBe("Aku Gigaviz.");
    });

    it('responds to "what is your name"', () => {
      expect(identityFallback("what is your name")).toBe("Aku Gigaviz.");
    });

    it('responds to "who are you"', () => {
      expect(identityFallback("who are you")).toBe("Aku Gigaviz.");
    });

    it("is case-insensitive", () => {
      expect(identityFallback("SIAPA NAMAMU")).toBe("Aku Gigaviz.");
      expect(identityFallback("What Is Your Name")).toBe("Aku Gigaviz.");
    });
  });

  describe("creator patterns", () => {
    it('responds to "siapa penciptamu"', () => {
      expect(identityFallback("siapa penciptamu")).toBe("Penciptanya adalah Giusty.");
    });

    it('responds to "who created you"', () => {
      expect(identityFallback("who created you")).toBe("Penciptanya adalah Giusty.");
    });

    it('responds to "who made you"', () => {
      expect(identityFallback("who made you")).toBe("Penciptanya adalah Giusty.");
    });

    it('responds to "who built you"', () => {
      expect(identityFallback("who built you")).toBe("Penciptanya adalah Giusty.");
    });

    it("is case-insensitive", () => {
      expect(identityFallback("WHO CREATED YOU")).toBe("Penciptanya adalah Giusty.");
    });
  });

  describe("model patterns", () => {
    it('responds to "model apa"', () => {
      const result = identityFallback("model apa yang kamu pakai?");
      expect(result).toContain("Gigaviz");
      expect(result).toContain("Giusty");
    });

    it('responds to "engine apa"', () => {
      const result = identityFallback("engine apa ini?");
      expect(result).toContain("mesin AI");
    });

    it('responds to "using which model"', () => {
      const result = identityFallback("using which model are you running?");
      expect(result).not.toBeNull();
    });

    it('responds to "pakai model"', () => {
      const result = identityFallback("kamu pakai model apa sih?");
      // "pake model" pattern should match "pakai model" variant
      expect(result).not.toBeNull();
    });
  });

  describe("no match", () => {
    it("returns null for unrelated questions", () => {
      expect(identityFallback("what is the weather today?")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(identityFallback("")).toBeNull();
    });

    it("returns null for partial matches", () => {
      expect(identityFallback("name")).toBeNull();
      expect(identityFallback("created")).toBeNull();
    });

    it("returns null for random text", () => {
      expect(identityFallback("lorem ipsum dolor sit amet")).toBeNull();
    });
  });
});
