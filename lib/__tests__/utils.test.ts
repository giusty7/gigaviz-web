import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn (class name utility)", () => {
  it("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    // twMerge should resolve p-4 vs p-2 → p-2 (last wins)
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("resolves Tailwind color conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("handles empty call", () => {
    expect(cn()).toBe("");
  });

  it("handles array input", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("preserves non-conflicting Tailwind classes", () => {
    expect(cn("p-4", "mt-2", "text-sm")).toBe("p-4 mt-2 text-sm");
  });
});
