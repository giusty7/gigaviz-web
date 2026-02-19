/**
 * Tests for Gigaviz Studio API Zod schemas
 * Validates create/update schemas for Graph Charts, Dashboards, Images, Videos,
 * Office Documents, Tracks Workflows, and Tracks Music
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

// ── Graph Images ──
const imageCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  style: z.enum([
    "photo-realistic", "illustration", "3d-render", "watercolor",
    "pixel-art", "abstract", "flat-design", "anime", "logo", "icon",
  ]),
  prompt: z.string().max(4000).optional(),
  negative_prompt: z.string().max(2000).optional(),
  width: z.number().int().min(256).max(4096).optional(),
  height: z.number().int().min(256).max(4096).optional(),
  format: z.enum(["png", "jpg", "webp", "svg"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const imageUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  style: z.enum([
    "photo-realistic", "illustration", "3d-render", "watercolor",
    "pixel-art", "abstract", "flat-design", "anime", "logo", "icon",
  ]).optional(),
  prompt: z.string().max(4000).optional(),
  negative_prompt: z.string().max(2000).optional(),
  width: z.number().int().min(256).max(4096).optional(),
  height: z.number().int().min(256).max(4096).optional(),
  format: z.enum(["png", "jpg", "webp", "svg"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// ── Graph Videos ──
const videoCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  style: z.enum([
    "marketing", "explainer", "product-demo", "social-reel",
    "animation", "cinematic", "tutorial", "testimonial",
  ]),
  prompt: z.string().max(4000).optional(),
  duration_seconds: z.number().int().min(5).max(300).optional(),
  resolution: z.enum(["720p", "1080p", "4k"]).optional(),
  format: z.enum(["mp4", "webm", "mov"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const videoUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  style: z.enum([
    "marketing", "explainer", "product-demo", "social-reel",
    "animation", "cinematic", "tutorial", "testimonial",
  ]).optional(),
  prompt: z.string().max(4000).optional(),
  duration_seconds: z.number().int().min(5).max(300).optional(),
  resolution: z.enum(["720p", "1080p", "4k"]).optional(),
  format: z.enum(["mp4", "webm", "mov"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// ── Tracks Music ──
const musicCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  genre: z.enum([
    "pop", "rock", "electronic", "ambient", "jazz", "classical",
    "hip-hop", "lo-fi", "cinematic", "jingle", "podcast-intro", "sound-effect",
  ]),
  prompt: z.string().max(4000).optional(),
  duration_seconds: z.number().int().min(5).max(600).optional(),
  bpm: z.number().int().min(40).max(300).optional(),
  key_signature: z.enum(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]).optional(),
  format: z.enum(["mp3", "wav", "ogg", "flac"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const musicUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  genre: z.enum([
    "pop", "rock", "electronic", "ambient", "jazz", "classical",
    "hip-hop", "lo-fi", "cinematic", "jingle", "podcast-intro", "sound-effect",
  ]).optional(),
  prompt: z.string().max(4000).optional(),
  duration_seconds: z.number().int().min(5).max(600).optional(),
  bpm: z.number().int().min(40).max(300).optional(),
  key_signature: z.enum(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]).optional(),
  format: z.enum(["mp3", "wav", "ogg", "flac"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
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

// ═══════════════════════════════════════════════════════════════════
// Graph Images
// ═══════════════════════════════════════════════════════════════════
describe("Graph Image — createSchema", () => {
  it("accepts valid photo-realistic image", () => {
    const result = imageCreateSchema.safeParse({
      title: "Product Photo",
      style: "photo-realistic",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all style values", () => {
    const styles = [
      "photo-realistic", "illustration", "3d-render", "watercolor",
      "pixel-art", "abstract", "flat-design", "anime", "logo", "icon",
    ];
    for (const s of styles) {
      const result = imageCreateSchema.safeParse({ title: "Test", style: s });
      expect(result.success).toBe(true);
    }
  });

  it("accepts full payload with all optional fields", () => {
    const result = imageCreateSchema.safeParse({
      title: "Brand Logo",
      description: "Modern minimalist logo",
      style: "logo",
      prompt: "A modern tech logo with gradient colors",
      negative_prompt: "blurry, low quality",
      width: 1024,
      height: 1024,
      format: "png",
      tags: ["brand", "logo"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = imageCreateSchema.safeParse({ style: "illustration" });
    expect(result.success).toBe(false);
  });

  it("rejects missing style", () => {
    const result = imageCreateSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid style", () => {
    const result = imageCreateSchema.safeParse({ title: "Test", style: "sketch" });
    expect(result.success).toBe(false);
  });

  it("rejects width below 256", () => {
    const result = imageCreateSchema.safeParse({
      title: "Test", style: "icon", width: 128,
    });
    expect(result.success).toBe(false);
  });

  it("rejects width above 4096", () => {
    const result = imageCreateSchema.safeParse({
      title: "Test", style: "icon", width: 8192,
    });
    expect(result.success).toBe(false);
  });

  it("rejects height below 256", () => {
    const result = imageCreateSchema.safeParse({
      title: "Test", style: "icon", height: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer width", () => {
    const result = imageCreateSchema.safeParse({
      title: "Test", style: "icon", width: 512.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format", () => {
    const result = imageCreateSchema.safeParse({
      title: "Test", style: "icon", format: "gif",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid formats", () => {
    const formats = ["png", "jpg", "webp", "svg"];
    for (const f of formats) {
      const result = imageCreateSchema.safeParse({ title: "Test", style: "icon", format: f });
      expect(result.success).toBe(true);
    }
  });

  it("rejects prompt exceeding 4000 chars", () => {
    const result = imageCreateSchema.safeParse({
      title: "Test", style: "icon", prompt: "x".repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative_prompt exceeding 2000 chars", () => {
    const result = imageCreateSchema.safeParse({
      title: "Test", style: "icon", negative_prompt: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const result = imageCreateSchema.safeParse({
      title: "Test", style: "icon",
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe("Graph Image — updateSchema", () => {
  it("accepts empty object (no fields to update)", () => {
    const result = imageUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial style change", () => {
    const result = imageUpdateSchema.safeParse({ style: "watercolor" });
    expect(result.success).toBe(true);
  });

  it("accepts partial dimension update", () => {
    const result = imageUpdateSchema.safeParse({ width: 512, height: 512 });
    expect(result.success).toBe(true);
  });

  it("rejects invalid style", () => {
    const result = imageUpdateSchema.safeParse({ style: "oil-painting" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = imageUpdateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Graph Videos
// ═══════════════════════════════════════════════════════════════════
describe("Graph Video — createSchema", () => {
  it("accepts valid marketing video", () => {
    const result = videoCreateSchema.safeParse({
      title: "Product Launch Video",
      style: "marketing",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all style values", () => {
    const styles = [
      "marketing", "explainer", "product-demo", "social-reel",
      "animation", "cinematic", "tutorial", "testimonial",
    ];
    for (const s of styles) {
      const result = videoCreateSchema.safeParse({ title: "Test", style: s });
      expect(result.success).toBe(true);
    }
  });

  it("accepts full payload with all optional fields", () => {
    const result = videoCreateSchema.safeParse({
      title: "Explainer Video",
      description: "How our product works",
      style: "explainer",
      prompt: "Create a 2D animation explaining SaaS onboarding",
      duration_seconds: 60,
      resolution: "1080p",
      format: "mp4",
      tags: ["marketing", "explainer"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = videoCreateSchema.safeParse({ style: "marketing" });
    expect(result.success).toBe(false);
  });

  it("rejects missing style", () => {
    const result = videoCreateSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid style", () => {
    const result = videoCreateSchema.safeParse({ title: "Test", style: "vlog" });
    expect(result.success).toBe(false);
  });

  it("rejects duration below 5 seconds", () => {
    const result = videoCreateSchema.safeParse({
      title: "Test", style: "marketing", duration_seconds: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration above 300 seconds", () => {
    const result = videoCreateSchema.safeParse({
      title: "Test", style: "marketing", duration_seconds: 600,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer duration", () => {
    const result = videoCreateSchema.safeParse({
      title: "Test", style: "marketing", duration_seconds: 30.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid resolutions", () => {
    const resolutions = ["720p", "1080p", "4k"];
    for (const r of resolutions) {
      const result = videoCreateSchema.safeParse({ title: "Test", style: "marketing", resolution: r });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid resolution", () => {
    const result = videoCreateSchema.safeParse({
      title: "Test", style: "marketing", resolution: "480p",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid formats", () => {
    const formats = ["mp4", "webm", "mov"];
    for (const f of formats) {
      const result = videoCreateSchema.safeParse({ title: "Test", style: "marketing", format: f });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid format", () => {
    const result = videoCreateSchema.safeParse({
      title: "Test", style: "marketing", format: "avi",
    });
    expect(result.success).toBe(false);
  });

  it("rejects prompt exceeding 4000 chars", () => {
    const result = videoCreateSchema.safeParse({
      title: "Test", style: "marketing", prompt: "x".repeat(4001),
    });
    expect(result.success).toBe(false);
  });
});

describe("Graph Video — updateSchema", () => {
  it("accepts empty object (no fields to update)", () => {
    const result = videoUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial style change", () => {
    const result = videoUpdateSchema.safeParse({ style: "cinematic" });
    expect(result.success).toBe(true);
  });

  it("accepts partial duration update", () => {
    const result = videoUpdateSchema.safeParse({ duration_seconds: 120 });
    expect(result.success).toBe(true);
  });

  it("rejects invalid style", () => {
    const result = videoUpdateSchema.safeParse({ style: "documentary" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = videoUpdateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects duration below minimum", () => {
    const result = videoUpdateSchema.safeParse({ duration_seconds: 1 });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tracks Music
// ═══════════════════════════════════════════════════════════════════
describe("Tracks Music — createSchema", () => {
  it("accepts valid pop track", () => {
    const result = musicCreateSchema.safeParse({
      title: "Brand Jingle",
      genre: "jingle",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all genre values", () => {
    const genres = [
      "pop", "rock", "electronic", "ambient", "jazz", "classical",
      "hip-hop", "lo-fi", "cinematic", "jingle", "podcast-intro", "sound-effect",
    ];
    for (const g of genres) {
      const result = musicCreateSchema.safeParse({ title: "Test", genre: g });
      expect(result.success).toBe(true);
    }
  });

  it("accepts full payload with all optional fields", () => {
    const result = musicCreateSchema.safeParse({
      title: "Ambient Background",
      description: "Calm ambient for meditation app",
      genre: "ambient",
      prompt: "Soft ambient pads with nature sounds",
      duration_seconds: 180,
      bpm: 72,
      key_signature: "A",
      format: "wav",
      tags: ["ambient", "meditation"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = musicCreateSchema.safeParse({ genre: "pop" });
    expect(result.success).toBe(false);
  });

  it("rejects missing genre", () => {
    const result = musicCreateSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid genre", () => {
    const result = musicCreateSchema.safeParse({ title: "Test", genre: "country" });
    expect(result.success).toBe(false);
  });

  it("rejects duration below 5 seconds", () => {
    const result = musicCreateSchema.safeParse({
      title: "Test", genre: "pop", duration_seconds: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration above 600 seconds", () => {
    const result = musicCreateSchema.safeParse({
      title: "Test", genre: "pop", duration_seconds: 900,
    });
    expect(result.success).toBe(false);
  });

  it("rejects bpm below 40", () => {
    const result = musicCreateSchema.safeParse({
      title: "Test", genre: "pop", bpm: 20,
    });
    expect(result.success).toBe(false);
  });

  it("rejects bpm above 300", () => {
    const result = musicCreateSchema.safeParse({
      title: "Test", genre: "electronic", bpm: 400,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer bpm", () => {
    const result = musicCreateSchema.safeParse({
      title: "Test", genre: "pop", bpm: 120.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid key signatures", () => {
    const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    for (const k of keys) {
      const result = musicCreateSchema.safeParse({ title: "Test", genre: "pop", key_signature: k });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid key signature", () => {
    const result = musicCreateSchema.safeParse({
      title: "Test", genre: "pop", key_signature: "Db",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid formats", () => {
    const formats = ["mp3", "wav", "ogg", "flac"];
    for (const f of formats) {
      const result = musicCreateSchema.safeParse({ title: "Test", genre: "pop", format: f });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid format", () => {
    const result = musicCreateSchema.safeParse({
      title: "Test", genre: "pop", format: "aac",
    });
    expect(result.success).toBe(false);
  });

  it("rejects prompt exceeding 4000 chars", () => {
    const result = musicCreateSchema.safeParse({
      title: "Test", genre: "pop", prompt: "x".repeat(4001),
    });
    expect(result.success).toBe(false);
  });
});

describe("Tracks Music — updateSchema", () => {
  it("accepts empty object (no fields to update)", () => {
    const result = musicUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial genre change", () => {
    const result = musicUpdateSchema.safeParse({ genre: "jazz" });
    expect(result.success).toBe(true);
  });

  it("accepts partial bpm and key update", () => {
    const result = musicUpdateSchema.safeParse({ bpm: 140, key_signature: "F#" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid genre", () => {
    const result = musicUpdateSchema.safeParse({ genre: "reggae" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = musicUpdateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects bpm below minimum", () => {
    const result = musicUpdateSchema.safeParse({ bpm: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects duration below minimum", () => {
    const result = musicUpdateSchema.safeParse({ duration_seconds: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid key_signature", () => {
    const result = musicUpdateSchema.safeParse({ key_signature: "H" });
    expect(result.success).toBe(false);
  });
});
