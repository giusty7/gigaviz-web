/**
 * Tests for lib/meta/graph.ts — Meta Graph API utility functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalizeGraphVersion, getGraphApiVersion, graphUrl } from "@/lib/meta/graph";

describe("normalizeGraphVersion", () => {
  it("returns default v20.0 for empty string", () => {
    expect(normalizeGraphVersion("")).toBe("v20.0");
  });

  it("returns default v20.0 for undefined", () => {
    expect(normalizeGraphVersion(undefined)).toBe("v20.0");
  });

  it("returns default v20.0 for whitespace-only", () => {
    expect(normalizeGraphVersion("  ")).toBe("v20.0");
  });

  it("preserves version that starts with v", () => {
    expect(normalizeGraphVersion("v19.0")).toBe("v19.0");
  });

  it("adds v prefix when missing", () => {
    expect(normalizeGraphVersion("19.0")).toBe("v19.0");
  });

  it("trims whitespace", () => {
    expect(normalizeGraphVersion("  v20.0  ")).toBe("v20.0");
  });

  it("handles integer versions", () => {
    expect(normalizeGraphVersion("20")).toBe("v20");
  });
});

describe("getGraphApiVersion", () => {
  beforeEach(() => {
    vi.stubEnv("META_GRAPH_API_VERSION", "");
    vi.stubEnv("WA_GRAPH_VERSION", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns v20.0 when no env vars set", () => {
    expect(getGraphApiVersion()).toBe("v20.0");
  });

  it("uses META_GRAPH_API_VERSION when set", () => {
    vi.stubEnv("META_GRAPH_API_VERSION", "v21.0");
    expect(getGraphApiVersion()).toBe("v21.0");
  });

  it("falls back to WA_GRAPH_VERSION", () => {
    vi.stubEnv("META_GRAPH_API_VERSION", "");
    vi.stubEnv("WA_GRAPH_VERSION", "v18.0");
    expect(getGraphApiVersion()).toBe("v18.0");
  });

  it("prefers META_GRAPH_API_VERSION over WA_GRAPH_VERSION", () => {
    vi.stubEnv("META_GRAPH_API_VERSION", "v21.0");
    vi.stubEnv("WA_GRAPH_VERSION", "v18.0");
    expect(getGraphApiVersion()).toBe("v21.0");
  });
});

describe("graphUrl", () => {
  it("builds correct URL with default version", () => {
    const url = graphUrl("12345/messages");
    expect(url).toMatch(/^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/12345\/messages$/);
  });

  it("uses provided version", () => {
    const url = graphUrl("12345/messages", "v19.0");
    expect(url).toBe("https://graph.facebook.com/v19.0/12345/messages");
  });

  it("strips leading slash from path", () => {
    const url = graphUrl("/12345/messages", "v20.0");
    expect(url).toBe("https://graph.facebook.com/v20.0/12345/messages");
  });

  it("handles empty path", () => {
    const url = graphUrl("", "v20.0");
    expect(url).toBe("https://graph.facebook.com/v20.0/");
  });

  it("handles complex paths", () => {
    const url = graphUrl("me/accounts?fields=name,id", "v20.0");
    expect(url).toBe("https://graph.facebook.com/v20.0/me/accounts?fields=name,id");
  });
});
