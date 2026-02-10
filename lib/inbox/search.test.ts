import { describe, it, expect } from "vitest";
import { buildMessageSearchQuery, mergeConversationIds } from "@/lib/inbox/search";

describe("buildMessageSearchQuery", () => {
  it("trims and normalizes whitespace", () => {
    expect(buildMessageSearchQuery("  hello   world ")).toBe("hello world");
  });

  it("returns null for empty/whitespace-only input", () => {
    expect(buildMessageSearchQuery("   ")).toBeNull();
  });
});

describe("mergeConversationIds", () => {
  it("deduplicates and merges arrays, handles null", () => {
    const merged = mergeConversationIds(["c1", "c2"], ["c2", "c3"], null, ["c3", "c4"]);
    expect(merged).toEqual(["c1", "c2", "c3", "c4"]);
  });
});
