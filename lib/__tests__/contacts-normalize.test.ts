import { describe, it, expect } from "vitest";
import { normalizePhone } from "../contacts/normalize";

describe("normalizePhone (contacts/normalize)", () => {
  it("strips all non-digit characters", () => {
    expect(normalizePhone("+62 812-3456-7890")).toBe("6281234567890");
  });

  it("strips parentheses and dots", () => {
    expect(normalizePhone("(021) 555.1234")).toBe("0215551234");
  });

  it("returns empty string for empty input", () => {
    expect(normalizePhone("")).toBe("");
  });

  it("returns empty string for null-ish input", () => {
    // The function casts to String with fallback
    expect(normalizePhone(null as unknown as string)).toBe("");
    expect(normalizePhone(undefined as unknown as string)).toBe("");
  });

  it("returns digits only for clean number", () => {
    expect(normalizePhone("628123456789")).toBe("628123456789");
  });

  it("handles whitespace-only input", () => {
    expect(normalizePhone("   ")).toBe("");
  });
});
