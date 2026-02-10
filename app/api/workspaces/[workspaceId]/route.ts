import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  workspace_type: z.enum(["individual", "team"]).optional(),
});

/**
 * PATCH /api/workspaces/[workspaceId]
 * Update workspace settings
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await supabaseServer();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate input
    const body = await req.json();
    const validated = updateSchema.parse(body);

    // Check if user is owner or admin of this workspace
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only workspace owners and admins can update settings" },
        { status: 403 }
      );
    }

    // Update workspace
    const { data: workspace, error: updateError } = await supabase
      .from("workspaces")
      .update(validated)
      .eq("id", workspaceId)
      .select()
      .single();

    if (updateError) {
      logger.error("Workspace update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update workspace" },
        { status: 500 }
      );
    }

    // Audit log
    await recordAuditEvent({
      workspaceId,
      action: "workspace.updated",
      actorUserId: user.id,
      actorEmail: user.email ?? null,
      meta: { updates: validated },
    });

    return NextResponse.json({ workspace });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    logger.error("PATCH /api/workspaces/[workspaceId]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]
 * Delete workspace (owner only, with safety checks)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await supabaseServer();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is OWNER (only owners can delete)
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only workspace owners can delete workspaces" },
        { status: 403 }
      );
    }

    // Get workspace info for audit
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name, slug")
      .eq("id", workspaceId)
      .single();

    // Safety check: Verify confirmation (require workspace name in request body)
    const body = await req.json();
    if (body.confirmName !== workspace?.name) {
      return NextResponse.json(
        { error: "Workspace name confirmation does not match" },
        { status: 400 }
      );
    }

    // Use admin client to delete (cascade will handle related records)
    const db = supabaseAdmin();

    // Audit log BEFORE deletion
    await recordAuditEvent({
      workspaceId,
      action: "workspace.deleted",
      actorUserId: user.id,
      actorEmail: user.email ?? null,
      meta: { workspaceName: workspace?.name, workspaceSlug: workspace?.slug },
    });

    // Delete workspace (cascade deletes members, invites, etc via FK constraints)
    const { error: deleteError } = await db
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);

    if (deleteError) {
      logger.error("Workspace deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete workspace" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (err) {
    logger.error("DELETE /api/workspaces/[workspaceId]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
