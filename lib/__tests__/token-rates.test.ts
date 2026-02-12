/**
 * Tests for lib/tokenRates.ts — token pricing data integrity
 */
import { describe, it, expect } from "vitest";
import { tokenRates, tokenRateList, tokenSafetyCopy } from "@/lib/tokenRates";
import type { TokenActionKey } from "@/lib/tokenRates";

const ALL_ACTIONS: TokenActionKey[] = [
  "helper_chat",
  "graph_generate_image",
  "tracks_generate",
  "office_export",
  "meta_send_message",
  "mass_blast_send",
];

describe("tokenRates", () => {
  it("has an entry for every TokenActionKey", () => {
    for (const action of ALL_ACTIONS) {
      expect(tokenRates[action]).toBeDefined();
    }
  });

  it("has exactly the expected number of actions", () => {
    expect(Object.keys(tokenRates)).toHaveLength(ALL_ACTIONS.length);
  });

  it("every entry has a positive integer token cost", () => {
    for (const rate of Object.values(tokenRates)) {
      expect(rate.tokens).toBeGreaterThan(0);
      expect(Number.isInteger(rate.tokens)).toBe(true);
    }
  });

  it("every entry has a non-empty description", () => {
    for (const rate of Object.values(tokenRates)) {
      expect(rate.description.length).toBeGreaterThan(0);
    }
  });

  it("every entry's action field matches its key", () => {
    for (const [key, rate] of Object.entries(tokenRates)) {
      expect(rate.action).toBe(key);
    }
  });

  it("has no duplicate action keys", () => {
    const keys = Object.keys(tokenRates);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

describe("tokenRateList", () => {
  it("is an array with the same length as tokenRates entries", () => {
    expect(Array.isArray(tokenRateList)).toBe(true);
    expect(tokenRateList).toHaveLength(Object.keys(tokenRates).length);
  });

  it("contains every rate from tokenRates", () => {
    for (const rate of Object.values(tokenRates)) {
      expect(tokenRateList).toContain(rate);
    }
  });

  it("every item conforms to TokenRate shape", () => {
    for (const rate of tokenRateList) {
      expect(rate).toHaveProperty("action");
      expect(rate).toHaveProperty("tokens");
      expect(rate).toHaveProperty("description");
      expect(typeof rate.action).toBe("string");
      expect(typeof rate.tokens).toBe("number");
      expect(typeof rate.description).toBe("string");
    }
  });
});

describe("tokenSafetyCopy", () => {
  it("is a non-empty string", () => {
    expect(typeof tokenSafetyCopy).toBe("string");
    expect(tokenSafetyCopy.length).toBeGreaterThan(0);
  });

  it("contains key safety terms", () => {
    expect(tokenSafetyCopy).toMatch(/token/i);
    expect(tokenSafetyCopy).toMatch(/balance|overspend|monitor/i);
  });
});

describe("token rate values are reasonable", () => {
  it("helper_chat costs 15 tokens", () => {
    expect(tokenRates.helper_chat.tokens).toBe(15);
  });

  it("meta_send_message is the cheapest action", () => {
    const min = Math.min(...tokenRateList.map((r) => r.tokens));
    expect(tokenRates.meta_send_message.tokens).toBe(min);
  });

  it("mass_blast_send is the most expensive action", () => {
    const max = Math.max(...tokenRateList.map((r) => r.tokens));
    expect(tokenRates.mass_blast_send.tokens).toBe(max);
  });

  it("all rates are between 1 and 1000", () => {
    for (const rate of tokenRateList) {
      expect(rate.tokens).toBeGreaterThanOrEqual(1);
      expect(rate.tokens).toBeLessThanOrEqual(1000);
    }
  });
});
