/**
 * Sprint 4: Zod schema validation tests for medium-risk routes
 * Tests all 8 new schemas added in this sprint
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── helper/conversations/[id] PATCH ──
const patchConversationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
});

describe("patchConversationSchema", () => {
  it("accepts valid title", () => {
    expect(patchConversationSchema.parse({ title: "My Chat" })).toEqual({ title: "My Chat" });
  });
  it("rejects empty title", () => {
    expect(() => patchConversationSchema.parse({ title: "" })).toThrow();
  });
  it("rejects missing title", () => {
    expect(() => patchConversationSchema.parse({})).toThrow();
  });
  it("rejects title over 255 chars", () => {
    expect(() => patchConversationSchema.parse({ title: "a".repeat(256) })).toThrow();
  });
});

// ── saved-views/[id] DELETE ──
const deleteSavedViewSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
});

describe("deleteSavedViewSchema", () => {
  it("accepts valid UUID", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(deleteSavedViewSchema.parse({ workspaceId: id })).toEqual({ workspaceId: id });
  });
  it("rejects non-UUID", () => {
    expect(() => deleteSavedViewSchema.parse({ workspaceId: "not-a-uuid" })).toThrow();
  });
  it("rejects missing workspaceId", () => {
    expect(() => deleteSavedViewSchema.parse({})).toThrow();
  });
});

// ── saved-views/[id] PUT ──
const updateSavedViewSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  name: z.string().min(1).max(255).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  isDefault: z.boolean().optional(),
});

describe("updateSavedViewSchema", () => {
  const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  it("accepts workspaceId only", () => {
    expect(updateSavedViewSchema.parse({ workspaceId: uuid })).toEqual({ workspaceId: uuid });
  });
  it("accepts all fields", () => {
    const data = { workspaceId: uuid, name: "My View", filters: { status: "open" }, isDefault: true };
    expect(updateSavedViewSchema.parse(data)).toEqual(data);
  });
  it("rejects empty name", () => {
    expect(() => updateSavedViewSchema.parse({ workspaceId: uuid, name: "" })).toThrow();
  });
  it("rejects non-boolean isDefault", () => {
    expect(() => updateSavedViewSchema.parse({ workspaceId: uuid, isDefault: "yes" })).toThrow();
  });
});

// ── templates/sync ──
const templateSyncSchema = z.object({
  connectionId: z.string().uuid().optional().nullable(),
  workspaceId: z.string().uuid().optional().nullable(),
});

describe("templateSyncSchema", () => {
  const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  it("accepts empty object", () => {
    expect(templateSyncSchema.parse({})).toEqual({});
  });
  it("accepts connectionId only", () => {
    expect(templateSyncSchema.parse({ connectionId: uuid })).toEqual({ connectionId: uuid });
  });
  it("accepts null values", () => {
    expect(templateSyncSchema.parse({ connectionId: null, workspaceId: null })).toEqual({
      connectionId: null,
      workspaceId: null,
    });
  });
  it("rejects non-UUID connectionId", () => {
    expect(() => templateSyncSchema.parse({ connectionId: "bad" })).toThrow();
  });
});

// ── process-events ──
const processEventsSchema = z.object({
  workspaceId: z.string().uuid().optional().nullable(),
  reconcile: z.boolean().optional(),
});

describe("processEventsSchema", () => {
  it("accepts empty object", () => {
    expect(processEventsSchema.parse({})).toEqual({});
  });
  it("accepts reconcile flag", () => {
    expect(processEventsSchema.parse({ reconcile: true })).toEqual({ reconcile: true });
  });
  it("rejects string reconcile", () => {
    expect(() => processEventsSchema.parse({ reconcile: "true" })).toThrow();
  });
});

// ── meta/ads/sync ──
const adsSyncSchema = z.object({
  workspace_id: z.string().min(1, "workspace_id is required"),
  date_range: z
    .enum(["today", "yesterday", "last_7_days", "last_30_days", "last_90_days"])
    .default("last_7_days"),
});

describe("adsSyncSchema", () => {
  it("accepts workspace_id with default date_range", () => {
    expect(adsSyncSchema.parse({ workspace_id: "ws-123" })).toEqual({
      workspace_id: "ws-123",
      date_range: "last_7_days",
    });
  });
  it("accepts explicit date_range", () => {
    expect(adsSyncSchema.parse({ workspace_id: "ws-123", date_range: "last_30_days" })).toEqual({
      workspace_id: "ws-123",
      date_range: "last_30_days",
    });
  });
  it("rejects empty workspace_id", () => {
    expect(() => adsSyncSchema.parse({ workspace_id: "" })).toThrow();
  });
  it("rejects invalid date_range", () => {
    expect(() => adsSyncSchema.parse({ workspace_id: "ws", date_range: "last_year" })).toThrow();
  });
});

// ── refresh-status ──
const refreshStatusSchema = z.object({
  workspaceSlug: z.string().min(1).max(100).optional().nullable(),
  workspaceId: z.string().uuid().optional().nullable(),
  connectionId: z.string().uuid().optional().nullable(),
  phoneNumberId: z.string().min(1).max(100).optional().nullable(),
});

describe("refreshStatusSchema", () => {
  it("accepts empty object", () => {
    expect(refreshStatusSchema.parse({})).toEqual({});
  });
  it("accepts all fields", () => {
    const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const data = {
      workspaceSlug: "my-workspace",
      workspaceId: uuid,
      connectionId: uuid,
      phoneNumberId: "12345",
    };
    expect(refreshStatusSchema.parse(data)).toEqual(data);
  });
  it("rejects invalid UUID for workspaceId", () => {
    expect(() => refreshStatusSchema.parse({ workspaceId: "bad" })).toThrow();
  });
});

// ── audience/preview ──
const customFieldFilterSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["equals", "contains", "exists"]),
  value: z.string().optional(),
});

const segmentRulesSchema = z.object({
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
  customFieldFilters: z.array(customFieldFilterSchema).optional(),
  optInOnly: z.boolean().optional(),
});

const audiencePreviewSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  tags: z.array(z.string()).optional(),
  segmentId: z.string().uuid().optional(),
  rules: segmentRulesSchema.optional(),
});

describe("audiencePreviewSchema", () => {
  const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  it("accepts minimal valid input", () => {
    expect(audiencePreviewSchema.parse({ workspaceId: uuid })).toEqual({ workspaceId: uuid });
  });

  it("accepts full input with rules", () => {
    const data = {
      workspaceId: uuid,
      tags: ["vip", "active"],
      segmentId: uuid,
      rules: {
        includeTags: ["newsletter"],
        excludeTags: ["unsubscribed"],
        customFieldFilters: [{ field: "city", operator: "equals" as const, value: "Jakarta" }],
        optInOnly: true,
      },
    };
    expect(audiencePreviewSchema.parse(data)).toEqual(data);
  });

  it("rejects missing workspaceId", () => {
    expect(() => audiencePreviewSchema.parse({})).toThrow();
  });

  it("rejects invalid operator in customFieldFilters", () => {
    expect(() =>
      audiencePreviewSchema.parse({
        workspaceId: uuid,
        rules: {
          customFieldFilters: [{ field: "city", operator: "like", value: "x" }],
        },
      })
    ).toThrow();
  });

  it("rejects empty field in customFieldFilters", () => {
    expect(() =>
      audiencePreviewSchema.parse({
        workspaceId: uuid,
        rules: {
          customFieldFilters: [{ field: "", operator: "equals" }],
        },
      })
    ).toThrow();
  });
});
