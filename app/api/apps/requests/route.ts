import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const appRequestSchema = z.object({
  app_name: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  use_case: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

/**
 * POST /api/apps/requests
 * Submit a new app request
 *
 * SECURITY: workspace_id and user_id derived from auth context, never from client body.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve workspace from cookie (set by proxy middleware)
    const workspaceId = req.cookies.get("gv_workspace_id")?.value;
    if (!workspaceId) {
      return NextResponse.json(
        { error: "No workspace selected" },
        { status: 400 }
      );
    }

    // Verify user is member of workspace (via RLS-scoped client)
    const { data: membership } = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied: You are not a member of this workspace" },
        { status: 403 }
      );
    }

    // Validate input with Zod
    const body = await req.json().catch(() => null);
    const parsed = appRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid_input" },
        { status: 400 }
      );
    }

    // Insert — workspace_id and user_id from auth context, NOT client body
    const { data: appRequest, error } = await supabase
      .from("apps_requests")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        app_name: parsed.data.app_name,
        description: parsed.data.description,
        use_case: parsed.data.use_case || null,
        priority: parsed.data.priority,
        status: "pending",
        upvotes: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error inserting app request:", { error, workspaceId });
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ request: appRequest }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/apps/requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
