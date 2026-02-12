import { logger } from "@/lib/logging";
import { supabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/with-error-handler";

/**
 * GET /api/workspaces/[workspaceId]/members
 * Get all members of a workspace for filtering and assignment
 */
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) => {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // Verify requester is a member of the workspace
    const { data: membership } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all workspace members with their profile info
    const { data: members, error: membersError } = await supabase
      .from("workspace_memberships")
      .select(
        `
        user_id,
        role,
        profiles:user_id (
          email,
          full_name,
          avatar_url
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("role", { ascending: false });

    if (membersError) {
      logger.error("Fetch members error:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Transform to simpler structure
    const transformedMembers = members?.map((m) => ({
      user_id: m.user_id,
      email: Array.isArray(m.profiles) && m.profiles[0]?.email ? m.profiles[0].email : "Unknown",
      full_name: Array.isArray(m.profiles) && m.profiles[0]?.full_name ? m.profiles[0].full_name : "Unknown User",
      avatar_url: Array.isArray(m.profiles) && m.profiles[0]?.avatar_url ? m.profiles[0].avatar_url : null,
      role: m.role,
    }));

    return NextResponse.json(transformedMembers ?? []);
  } catch (error) {
    logger.error("Get workspace members error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
