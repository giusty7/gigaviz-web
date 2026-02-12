/**
 * AI Reply Settings API
 * 
 * Manage workspace AI reply configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { logger } from "@/lib/logging";
import {
  getAIReplySettings,
  upsertAIReplySettings,
  getAIReplyStats,
} from "@/lib/meta/ai-reply-service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

// ============================================================================
// SCHEMAS
// ============================================================================

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  aiModel: z.enum(["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(50).max(2000).optional(),
  systemPrompt: z.string().max(4000).nullable().optional(),
  greetingMessage: z.string().max(1000).nullable().optional(),
  fallbackMessage: z.string().max(1000).optional(),
  useKnowledgeBase: z.boolean().optional(),
  knowledgeConfidenceThreshold: z.number().min(0).max(1).optional(),
  activeHoursEnabled: z.boolean().optional(),
  activeHoursStart: z.string().nullable().optional(),
  activeHoursEnd: z.string().nullable().optional(),
  activeTimezone: z.string().optional(),
  cooldownSeconds: z.number().int().min(0).optional(),
  maxMessagesPerThread: z.number().int().min(1).nullable().optional(),
  maxMessagesPerDay: z.number().int().min(0).optional(),
  handoffKeywords: z.array(z.string()).optional(),
  handoffMessage: z.string().max(1000).optional(),
  autoHandoffAfterMessages: z.number().int().min(1).nullable().optional(),
});

// ============================================================================
// GET - Get AI reply settings
// ============================================================================

export const GET = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeStats = searchParams.get("includeStats") === "true";

    const settings = await getAIReplySettings(ctx.currentWorkspace.id);

    // Return default settings if none exist
    const response = settings || {
      id: null,
      workspaceId: ctx.currentWorkspace.id,
      enabled: false,
      aiModel: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 500,
      systemPrompt: null,
      greetingMessage: null,
      fallbackMessage: "Mohon maaf, saya tidak dapat membantu saat ini. Tim kami akan segera menghubungi Anda.",
      useKnowledgeBase: true,
      knowledgeConfidenceThreshold: 0.7,
      activeHoursEnabled: false,
      activeHoursStart: null,
      activeHoursEnd: null,
      activeTimezone: "Asia/Jakarta",
      cooldownSeconds: 5,
      maxMessagesPerThread: null,
      maxMessagesPerDay: 100,
      handoffKeywords: ["agent", "human", "operator", "manusia", "cs"],
      handoffMessage: "Baik, saya akan meneruskan percakapan ini ke tim kami. Mohon tunggu sebentar.",
      autoHandoffAfterMessages: null,
    };

    if (includeStats) {
      const stats = await getAIReplyStats(ctx.currentWorkspace.id);
      return NextResponse.json({ settings: response, stats });
    }

    return NextResponse.json(response);
  } catch (err) {
    logger.error("[ai-settings] GET error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ============================================================================
// POST - Update AI reply settings
// ============================================================================

export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin/owner role
    if (!["owner", "admin"].includes(ctx.currentRole || "")) {
      return NextResponse.json({ error: "Forbidden - Admin required" }, { status: 403 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const settings = await upsertAIReplySettings(ctx.currentWorkspace.id, validated);

    logger.info("[ai-settings] Settings updated", {
      workspaceId: ctx.currentWorkspace.id,
      userId: ctx.user.id,
      enabled: settings.enabled,
    });

    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("[ai-settings] POST error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// ============================================================================
// PATCH - Toggle AI reply on/off (quick toggle)
// ============================================================================

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { enabled } = z.object({ enabled: z.boolean() }).parse(body);

    const settings = await upsertAIReplySettings(ctx.currentWorkspace.id, { enabled });

    logger.info("[ai-settings] AI reply toggled", {
      workspaceId: ctx.currentWorkspace.id,
      userId: ctx.user.id,
      enabled,
    });

    return NextResponse.json({ success: true, enabled: settings.enabled });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    }
    logger.error("[ai-settings] PATCH error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
