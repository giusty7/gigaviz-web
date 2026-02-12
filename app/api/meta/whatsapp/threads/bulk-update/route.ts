import { logger } from "@/lib/logging";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const bulkUpdateSchema = z.object({
  workspaceId: z.string().uuid(),
  threadIds: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(["status", "assign", "tag"]),
  value: z.string().nullable().default(null),
});

/**
 * POST /api/meta/whatsapp/threads/bulk-update
 * Bulk update threads (status, assign, tags)
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, threadIds, action, value } = bulkUpdateSchema.parse(body);

    // Verify workspace membership
    const { data: membership } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Perform bulk update based on action
    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "status":
        if (!value || !["open", "pending", "resolved"].includes(value)) {
          return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
        }
        updateData = { status: value, updated_at: new Date().toISOString() };
        break;

      case "assign":
        // Verify assignee is workspace member if not null
        if (value !== null) {
          const { data: assigneeMember } = await supabase
            .from("workspace_memberships")
            .select("user_id")
            .eq("workspace_id", workspaceId)
            .eq("user_id", value)
            .single();

          if (!assigneeMember) {
            return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
          }
        }
        updateData = { assigned_to: value, updated_at: new Date().toISOString() };
        break;

      case "tag":
        // Tags are handled separately - append to existing array
        if (!value || typeof value !== "string") {
          return NextResponse.json({ error: "Invalid tag value" }, { status: 400 });
        }

        // Fetch current threads to merge tags
        const { data: currentThreads } = await supabase
          .from("wa_threads")
          .select("id, tags")
          .eq("workspace_id", workspaceId)
          .in("id", threadIds);

        if (!currentThreads) {
          return NextResponse.json({ error: "Threads not found" }, { status: 404 });
        }

        // Update each thread individually to merge tags
        const tagUpdates = currentThreads.map(async (thread) => {
          const existingTags = Array.isArray(thread.tags) ? thread.tags : [];
          const newTags = existingTags.includes(value) ? existingTags : [...existingTags, value];

          return supabase
            .from("wa_threads")
            .update({ tags: newTags, updated_at: new Date().toISOString() })
            .eq("id", thread.id)
            .eq("workspace_id", workspaceId);
        });

        await Promise.all(tagUpdates);

        return NextResponse.json({
          success: true,
          updated: currentThreads.length,
          action: "tag",
          value,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update threads for status/assign actions
    if (action === "status" || action === "assign") {
      const { error: updateError } = await supabase
        .from("wa_threads")
        .update(updateData)
        .eq("workspace_id", workspaceId)
        .in("id", threadIds);

      if (updateError) {
        logger.error("Bulk update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update threads", details: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      updated: threadIds.length,
      action,
      value,
    });
  } catch (error) {
    logger.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
