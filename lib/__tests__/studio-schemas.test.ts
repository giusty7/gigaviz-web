/**
 * Tests for Gigaviz Studio API Zod schemas
 * Validates create/update schemas for Graph Charts, Dashboards, Office Documents, and Tracks Workflows
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Re-declare schemas (same as API routes) ────────────────────
// We re-declare to test schemas in isolation without importing route handlers

// ── Graph Charts ──
const chartCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  chart_type: z.enum(["bar", "line", "pie", "area", "scatter", "radar", "heatmap"]),
  config_json: z.unknown().optional(),
  data_source: z.enum(["manual", "api", "database", "csv"]).optional(),
  data_json: z.unknown().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const chartUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  chart_type: z.enum(["bar", "line", "pie", "area", "scatter", "radar", "heatmap"]).optional(),
  config_json: z.unknown().optional(),
  data_source: z.enum(["manual", "api", "database", "csv"]).optional(),
  data_json: z.unknown().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// ── Graph Dashboards ──
const dashboardCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  is_public: z.boolean().optional(),
});

const dashboardUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  is_public: z.boolean().optional(),
  layout_json: z.unknown().optional(),
});

// ── Office Documents ──
const documentCreateSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(["document", "spreadsheet", "presentation", "invoice", "report"]),
  ai_prompt: z.string().max(4096).optional(),
  template_id: z.string().uuid().optional(),
  content_json: z.unknown().optional(),
});

const documentUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.enum(["document", "spreadsheet", "presentation", "invoice", "report"]).optional(),
  content_json: z.unknown().optional(),
});

// ── Tracks Workflows ──
const workflowCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  steps_json: z.unknown().optional(),
  triggers_json: z.unknown().optional(),
  estimated_tokens_per_run: z.number().positive().optional(),
});

const workflowUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
  steps_json: z.unknown().optional(),
  triggers_json: z.unknown().optional(),
  estimated_tokens_per_run: z.number().positive().optional(),
});

// ═══════════════════════════════════════════════════════════════════
// Graph Charts
// ═══════════════════════════════════════════════════════════════════
describe("Graph Chart — createSchema", () => {
  it("accepts valid bar chart", () => {
    const result = chartCreateSchema.safeParse({
      title: "Monthly Revenue",
      chart_type: "bar",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all chart types", () => {
    const types = ["bar", "line", "pie", "area", "scatter", "radar", "heatmap"];
    for (const ct of types) {
      const result = chartCreateSchema.safeParse({ title: "Test", chart_type: ct });
      expect(result.success).toBe(true);
    }
  });

  it("accepts full payload with all optional fields", () => {
    const result = chartCreateSchema.safeParse({
      title: "Revenue by Region",
      description: "Q1 analysis",
      chart_type: "pie",
      config_json: { colors: ["#ff0000"] },
      data_source: "api",
      data_json: { rows: [] },
      tags: ["revenue", "q1"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = chartCreateSchema.safeParse({ chart_type: "bar" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = chartCreateSchema.safeParse({ title: "", chart_type: "bar" });
    expect(result.success).toBe(false);
  });

  it("rejects missing chart_type", () => {
    const result = chartCreateSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid chart_type", () => {
    const result = chartCreateSchema.safeParse({ title: "Test", chart_type: "donut" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid data_source", () => {
    const result = chartCreateSchema.safeParse({
      title: "Test",
      chart_type: "bar",
      data_source: "graphql",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 255 chars", () => {
    const result = chartCreateSchema.safeParse({
      title: "x".repeat(256),
      chart_type: "bar",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 2000 chars", () => {
    const result = chartCreateSchema.safeParse({
      title: "Test",
      chart_type: "bar",
      description: "d".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const result = chartCreateSchema.safeParse({
      title: "Test",
      chart_type: "bar",
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects tag exceeding 50 chars", () => {
    const result = chartCreateSchema.safeParse({
      title: "Test",
      chart_type: "bar",
      tags: ["x".repeat(51)],
    });
    expect(result.success).toBe(false);
  });
});

describe("Graph Chart — updateSchema", () => {
  it("accepts empty object (no fields to update)", () => {
    const result = chartUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial title update", () => {
    const result = chartUpdateSchema.safeParse({ title: "New Title" });
    expect(result.success).toBe(true);
  });

  it("accepts partial chart_type change", () => {
    const result = chartUpdateSchema.safeParse({ chart_type: "line" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = chartUpdateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid chart_type", () => {
    const result = chartUpdateSchema.safeParse({ chart_type: "treemap" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Graph Dashboards
// ═══════════════════════════════════════════════════════════════════
describe("Graph Dashboard — createSchema", () => {
  it("accepts minimal dashboard", () => {
    const result = dashboardCreateSchema.safeParse({ title: "Q1 Overview" });
    expect(result.success).toBe(true);
  });

  it("accepts full payload", () => {
    const result = dashboardCreateSchema.safeParse({
      title: "Performance Dashboard",
      description: "Key metrics at a glance",
      is_public: true,
    });
    expect(result.success).toBe(true);
  });

  it("defaults is_public to undefined (handled by API)", () => {
    const result = dashboardCreateSchema.safeParse({ title: "Private Dash" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_public).toBeUndefined();
    }
  });

  it("rejects missing title", () => {
    const result = dashboardCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean is_public", () => {
    const result = dashboardCreateSchema.safeParse({ title: "Test", is_public: "yes" });
    expect(result.success).toBe(false);
  });
});

describe("Graph Dashboard — updateSchema", () => {
  it("accepts empty object", () => {
    const result = dashboardUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts layout_json update", () => {
    const result = dashboardUpdateSchema.safeParse({
      layout_json: { grid: [[1, 2], [3, 4]] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts visibility toggle", () => {
    const result = dashboardUpdateSchema.safeParse({ is_public: false });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Office Documents
// ═══════════════════════════════════════════════════════════════════
describe("Office Document — createSchema", () => {
  it("accepts minimal document", () => {
    const result = documentCreateSchema.safeParse({
      title: "Invoice Q1",
      category: "invoice",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all categories", () => {
    const categories = ["document", "spreadsheet", "presentation", "invoice", "report"];
    for (const cat of categories) {
      const result = documentCreateSchema.safeParse({ title: "Test", category: cat });
      expect(result.success).toBe(true);
    }
  });

  it("accepts full payload with AI prompt and template", () => {
    const result = documentCreateSchema.safeParse({
      title: "Auto Report",
      category: "report",
      ai_prompt: "Generate a quarterly report for sales team",
      template_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      content_json: { sections: [] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = documentCreateSchema.safeParse({ category: "document" });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const result = documentCreateSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = documentCreateSchema.safeParse({ title: "Test", category: "email" });
    expect(result.success).toBe(false);
  });

  it("rejects ai_prompt exceeding 4096 chars", () => {
    const result = documentCreateSchema.safeParse({
      title: "Test",
      category: "document",
      ai_prompt: "x".repeat(4097),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid template_id (not UUID)", () => {
    const result = documentCreateSchema.safeParse({
      title: "Test",
      category: "document",
      template_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("Office Document — updateSchema", () => {
  it("accepts empty object", () => {
    const result = documentUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts title-only update", () => {
    const result = documentUpdateSchema.safeParse({ title: "Updated Title" });
    expect(result.success).toBe(true);
  });

  it("accepts content_json update", () => {
    const result = documentUpdateSchema.safeParse({
      content_json: { body: "Hello world" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = documentUpdateSchema.safeParse({ category: "pdf" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tracks Workflows
// ═══════════════════════════════════════════════════════════════════
describe("Tracks Workflow — createSchema", () => {
  it("accepts minimal workflow", () => {
    const result = workflowCreateSchema.safeParse({ title: "Lead Follow-Up" });
    expect(result.success).toBe(true);
  });

  it("accepts full payload", () => {
    const result = workflowCreateSchema.safeParse({
      title: "Order Processing",
      description: "Automate order confirmation and tracking",
      steps_json: [{ type: "send_whatsapp", template: "order_confirm" }],
      triggers_json: { type: "webhook", url: "/api/orders" },
      estimated_tokens_per_run: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = workflowCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = workflowCreateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative estimated_tokens_per_run", () => {
    const result = workflowCreateSchema.safeParse({
      title: "Test",
      estimated_tokens_per_run: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero estimated_tokens_per_run", () => {
    const result = workflowCreateSchema.safeParse({
      title: "Test",
      estimated_tokens_per_run: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("Tracks Workflow — updateSchema", () => {
  it("accepts empty object", () => {
    const result = workflowUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts status change to active", () => {
    const result = workflowUpdateSchema.safeParse({ status: "active" });
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    const statuses = ["draft", "active", "paused", "archived"];
    for (const s of statuses) {
      const result = workflowUpdateSchema.safeParse({ status: s });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = workflowUpdateSchema.safeParse({ status: "deleted" });
    expect(result.success).toBe(false);
  });

  it("accepts steps_json update", () => {
    const result = workflowUpdateSchema.safeParse({
      steps_json: [{ type: "delay", seconds: 60 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-positive estimated_tokens_per_run", () => {
    const result = workflowUpdateSchema.safeParse({
      estimated_tokens_per_run: 0,
    });
    expect(result.success).toBe(false);
  });
});
