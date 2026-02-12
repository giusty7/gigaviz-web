import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

// ============================================================================
// Track usage of quick reply (increment use_count, update last_used_at)
// ============================================================================

const schema = z.object({
  quickReplyId: z.string().uuid(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { quickReplyId } = schema.parse(body);

    const db = await supabaseServer();

    // Increment usage
    const { error } = await db.rpc("increment_quick_reply_usage", {
      p_quick_reply_id: quickReplyId,
      p_workspace_id: ctx.currentWorkspace.id,
    });

    if (error) {
      // Fallback to manual update if RPC doesn't exist
      const { error: updateError } = await db
        .from("inbox_quick_replies")
        .update({
          use_count: db.rpc("increment", { row_id: quickReplyId }) as unknown as number,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", quickReplyId)
        .eq("workspace_id", ctx.currentWorkspace.id);

      if (updateError) {
        // Final fallback - just update last_used_at
        await db
          .from("inbox_quick_replies")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", quickReplyId)
          .eq("workspace_id", ctx.currentWorkspace.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    logger.error("Quick reply usage tracking error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
