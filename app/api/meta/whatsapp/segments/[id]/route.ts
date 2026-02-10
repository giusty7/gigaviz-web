/**
 * PATCH /api/meta/whatsapp/segments/[id]
 * Update segment
 * 
 * DELETE /api/meta/whatsapp/segments/[id]
 * Delete segment
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { UpdateSegmentRequest } from "@/types/wa-contacts";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await supabaseServer();
    const { id } = await params;

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateSegmentRequest & {
      workspaceId: string;
    };

    if (!body.workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Verify workspace access & segment ownership
    const { data: segment } = await supabase
      .from("wa_contact_segments")
      .select("workspace_id")
      .eq("id", id)
      .single();

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    if (segment.workspace_id !== body.workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", body.workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Segments API PUT] Membership query error:", {
        error: membershipError,
        workspaceId: body.workspaceId,
        userId: user.id,
        segmentId: id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      logger.warn("[Segments API PUT] Access denied:", {
        workspaceId: body.workspaceId,
        userId: user.id,
        segmentId: id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      // Check for duplicate name
      const { data: existing } = await supabase
        .from("wa_contact_segments")
        .select("id")
        .eq("workspace_id", body.workspaceId)
        .eq("name", body.name)
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Segment name already exists" },
          { status: 409 }
        );
      }

      updates.name = body.name;
    }

    if (body.description !== undefined) {
      updates.description = body.description;
    }

    if (body.rules !== undefined) {
      updates.rules = body.rules;
    }

    // Update segment
    const { data: updated, error } = await supabase
      .from("wa_contact_segments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[Segments API] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("[Segments API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await supabaseServer();
    const { id } = await params;

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Verify workspace access & segment ownership
    const { data: segment } = await supabase
      .from("wa_contact_segments")
      .select("workspace_id")
      .eq("id", id)
      .single();

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    if (segment.workspace_id !== workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Segments API DELETE] Membership query error:", {
        error: membershipError,
        workspaceId,
        userId: user.id,
        segmentId: id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      logger.warn("[Segments API DELETE] Access denied:", {
        workspaceId,
        userId: user.id,
        segmentId: id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete segment
    const { error } = await supabase
      .from("wa_contact_segments")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("[Segments API] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[Segments API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
