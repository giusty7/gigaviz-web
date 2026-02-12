/**
 * Tests for Zod validation schemas used in API routes
 *
 * Validates schemas parse correct input and reject bad input.
 * Tests schemas in isolation (no server, no DB).
 */
import { describe, it, expect } from "vitest";
import { z, ZodError } from "zod";

// ─── Schema Definitions (mirrored from routes) ─────────────────────

// From: app/api/ops/sql-query/route.ts
const sqlQuerySchema = z.object({
  query: z.string().min(1, "query_required").max(10000, "query_too_long"),
});

// From: app/api/ops/feature-flags/route.ts
const flagPostSchema = z.union([
  z.object({
    workspaceId: z.string().uuid(),
    flagKey: z.string().min(1).max(100),
    enabled: z.boolean(),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    flagKey: z.string().min(1).max(200),
    flagName: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    defaultEnabled: z.boolean(),
  }),
]);

// From: app/api/invites/accept/route.ts
const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// From: app/api/meta/whatsapp/contacts/bulk-paste/route.ts
const bulkPasteSchema = z.object({
  lines: z.array(z.string()).min(1, "At least one line required").max(10000, "Max 10,000 lines"),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().optional().default("bulk_paste"),
});

// From: app/api/meta/whatsapp/contacts/import-csv/route.ts
const csvImportSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  csvData: z.string().min(1, "CSV data required").max(5 * 1024 * 1024, "CSV too large (max 5MB)"),
  mapping: z.record(z.string(), z.string()),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().optional().default("csv_import"),
});

// From: app/api/helper/tools/call/route.ts
const callRequestSchema = z.object({
  toolId: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()).optional().default({}),
  workspaceId: z.string().uuid(),
});

// From: app/api/workspaces/[workspaceId]/entitlements/usage-cap/route.ts
const usageCapSchema = z.object({
  cap: z.number().int().min(0).max(1_000_000_000).nullable(),
});

// ─── Tests ──────────────────────────────────────────────────────────

describe("sqlQuerySchema", () => {
  it("accepts valid query", () => {
    const result = sqlQuerySchema.parse({ query: "SELECT * FROM workspaces LIMIT 10" });
    expect(result.query).toBe("SELECT * FROM workspaces LIMIT 10");
  });

  it("rejects empty query", () => {
    expect(() => sqlQuerySchema.parse({ query: "" })).toThrow(ZodError);
  });

  it("rejects missing query", () => {
    expect(() => sqlQuerySchema.parse({})).toThrow(ZodError);
  });

  it("rejects query over 10k chars", () => {
    expect(() => sqlQuerySchema.parse({ query: "x".repeat(10001) })).toThrow(ZodError);
  });

  it("accepts query at max length", () => {
    const result = sqlQuerySchema.parse({ query: "x".repeat(10000) });
    expect(result.query.length).toBe(10000);
  });
});

describe("flagPostSchema", () => {
  it("accepts workspace override", () => {
    const result = flagPostSchema.parse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      flagKey: "dark_mode",
      enabled: true,
    });
    expect(result).toBeDefined();
  });

  it("accepts global flag creation", () => {
    const result = flagPostSchema.parse({
      flagKey: "new_feature",
      flagName: "New Feature Flag",
      defaultEnabled: false,
    });
    expect(result).toBeDefined();
  });

  it("rejects workspace override with invalid UUID", () => {
    expect(() =>
      flagPostSchema.parse({
        workspaceId: "not-a-uuid",
        flagKey: "test",
        enabled: true,
      })
    ).toThrow(ZodError);
  });

  it("rejects empty flagKey", () => {
    expect(() =>
      flagPostSchema.parse({
        flagKey: "",
        flagName: "Test",
        defaultEnabled: true,
      })
    ).toThrow(ZodError);
  });
});

describe("acceptInviteSchema", () => {
  it("accepts valid token", () => {
    const result = acceptInviteSchema.parse({ token: "abc123-invite-token" });
    expect(result.token).toBe("abc123-invite-token");
  });

  it("rejects empty token", () => {
    expect(() => acceptInviteSchema.parse({ token: "" })).toThrow(ZodError);
  });

  it("rejects missing token", () => {
    expect(() => acceptInviteSchema.parse({})).toThrow(ZodError);
  });
});

describe("bulkPasteSchema", () => {
  it("accepts valid phone lines", () => {
    const result = bulkPasteSchema.parse({
      lines: ["+6281234567890", "+6289876543210"],
    });
    expect(result.lines).toHaveLength(2);
    expect(result.tags).toEqual([]);
    expect(result.source).toBe("bulk_paste");
  });

  it("accepts with tags and source", () => {
    const result = bulkPasteSchema.parse({
      lines: ["+62123"],
      tags: ["vip", "new"],
      source: "manual",
    });
    expect(result.tags).toEqual(["vip", "new"]);
    expect(result.source).toBe("manual");
  });

  it("rejects empty lines array", () => {
    expect(() => bulkPasteSchema.parse({ lines: [] })).toThrow(ZodError);
  });

  it("rejects over 10k lines", () => {
    const lines = Array.from({ length: 10001 }, (_, i) => `+62${i}`);
    expect(() => bulkPasteSchema.parse({ lines })).toThrow(ZodError);
  });
});

describe("csvImportSchema", () => {
  it("accepts valid CSV import", () => {
    const result = csvImportSchema.parse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      csvData: "name,phone\nAlice,+62123",
      mapping: { name: "display_name", phone: "normalized_phone" },
    });
    expect(result.csvData).toContain("Alice");
    expect(result.tags).toEqual([]);
    expect(result.source).toBe("csv_import");
  });

  it("rejects invalid UUID workspace", () => {
    expect(() =>
      csvImportSchema.parse({
        workspaceId: "bad",
        csvData: "data",
        mapping: {},
      })
    ).toThrow(ZodError);
  });

  it("rejects empty CSV data", () => {
    expect(() =>
      csvImportSchema.parse({
        workspaceId: "550e8400-e29b-41d4-a716-446655440000",
        csvData: "",
        mapping: {},
      })
    ).toThrow(ZodError);
  });
});

describe("callRequestSchema", () => {
  it("accepts valid tool call", () => {
    const result = callRequestSchema.parse({
      toolId: "web_search",
      parameters: { query: "gigaviz pricing" },
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.toolId).toBe("web_search");
    expect(result.parameters).toEqual({ query: "gigaviz pricing" });
  });

  it("defaults parameters to empty object", () => {
    const result = callRequestSchema.parse({
      toolId: "list_tools",
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.parameters).toEqual({});
  });

  it("rejects empty toolId", () => {
    expect(() =>
      callRequestSchema.parse({
        toolId: "",
        workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      })
    ).toThrow(ZodError);
  });

  it("rejects invalid workspaceId", () => {
    expect(() =>
      callRequestSchema.parse({ toolId: "test", workspaceId: "not-uuid" })
    ).toThrow(ZodError);
  });
});

describe("usageCapSchema", () => {
  it("accepts numeric cap", () => {
    const result = usageCapSchema.parse({ cap: 1000 });
    expect(result.cap).toBe(1000);
  });

  it("accepts null cap (unlimited)", () => {
    const result = usageCapSchema.parse({ cap: null });
    expect(result.cap).toBeNull();
  });

  it("accepts zero cap", () => {
    const result = usageCapSchema.parse({ cap: 0 });
    expect(result.cap).toBe(0);
  });

  it("rejects negative cap", () => {
    expect(() => usageCapSchema.parse({ cap: -1 })).toThrow(ZodError);
  });

  it("rejects cap over 1 billion", () => {
    expect(() => usageCapSchema.parse({ cap: 1_000_000_001 })).toThrow(ZodError);
  });

  it("rejects float cap", () => {
    expect(() => usageCapSchema.parse({ cap: 10.5 })).toThrow(ZodError);
  });

  it("accepts cap at max boundary", () => {
    const result = usageCapSchema.parse({ cap: 1_000_000_000 });
    expect(result.cap).toBe(1_000_000_000);
  });
});
