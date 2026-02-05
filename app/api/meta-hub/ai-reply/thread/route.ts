/**
 * AI Reply Thread Toggle API
 * 
 * Enable/disable AI for specific threads
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { logger } from "@/lib/logging";
import {
  getThreadState,
  setThreadAIEnabled,
  handoffThread,
  upsertThreadState,
} from "@/lib/meta/ai-reply-service";

// ============================================================================
// SCHEMAS
// ============================================================================

const toggleSchema = z.object({
  threadId: z.string().uuid(),
  enabled: z.boolean(),
});

const handoffSchema = z.object({
  threadId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const resetSchema = z.object({
  threadId: z.string().uuid(),
});

// ============================================================================
// GET - Get thread AI state
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json({ error: "threadId required" }, { status: 400 });
    }

    const state = await getThreadState(ctx.currentWorkspace.id, threadId);

    return NextResponse.json(state || {
      threadId,
      aiEnabled: true,
      messageCount: 0,
      handedOff: false,
    });
  } catch (err) {
    logger.error("[ai-thread] GET error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// POST - Toggle AI for thread
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "toggle") {
      const { threadId, enabled } = toggleSchema.parse(body);
      await setThreadAIEnabled(ctx.currentWorkspace.id, threadId, enabled);

      logger.info("[ai-thread] AI toggled for thread", {
        workspaceId: ctx.currentWorkspace.id,
        threadId,
        enabled,
      });

      return NextResponse.json({ success: true, enabled });
    }

    if (action === "handoff") {
      const { threadId, reason } = handoffSchema.parse(body);
      await handoffThread(ctx.currentWorkspace.id, threadId, reason || "Manual handoff by agent");

      logger.info("[ai-thread] Thread handed off", {
        workspaceId: ctx.currentWorkspace.id,
        threadId,
        reason,
      });

      return NextResponse.json({ success: true, handedOff: true });
    }

    if (action === "reset") {
      const { threadId } = resetSchema.parse(body);
      await upsertThreadState(ctx.currentWorkspace.id, threadId, {
        aiEnabled: true,
        handedOff: false,
        handedOffAt: null,
        handedOffReason: null,
        messageCount: 0,
        contextWindow: [],
      });

      logger.info("[ai-thread] Thread AI state reset", {
        workspaceId: ctx.currentWorkspace.id,
        threadId,
      });

      return NextResponse.json({ success: true, reset: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("[ai-thread] POST error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
