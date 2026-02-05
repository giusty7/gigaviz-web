/**
 * AI Reply Logs API
 * 
 * View AI reply history and analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import { getAIReplyStats } from "@/lib/meta/ai-reply-service";

// ============================================================================
// GET - Get AI reply logs
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const statsOnly = searchParams.get("statsOnly") === "true";

    // If only stats requested
    if (statsOnly) {
      const days = parseInt(searchParams.get("days") || "7", 10);
      const stats = await getAIReplyStats(ctx.currentWorkspace.id, days);
      return NextResponse.json(stats);
    }

    const db = await supabaseServer();
    let query = db
      .from("ai_reply_logs")
      .select("*", { count: "exact" })
      .eq("workspace_id", ctx.currentWorkspace.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (threadId) {
      query = query.eq("thread_id", threadId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    logger.error("[ai-logs] GET error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
