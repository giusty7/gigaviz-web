/**
 * PATCH /api/meta/whatsapp/segments/[id]
 * Update segment
 * 
 * DELETE /api/meta/whatsapp/segments/[id]
 * Delete segment
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const updateSegmentSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspaceId"),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  rules: z.record(z.string(), z.unknown()).optional(),
});

const deleteQuerySchema = z.object({
  workspaceId: z.string().uuid("Invalid workspaceId"),
});

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

    const rawBody = await request.json().catch(() => null);
    const parsed = updateSegmentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid_input" },
        { status: 400 }
      );
    }

    const { workspaceId } = parsed.data;

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
      logger.error("[Segments API PUT] Membership query error:", {
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
      logger.warn("[Segments API PUT] Access denied:", {
        workspaceId,
        userId: user.id,
        segmentId: id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) {
      // Check for duplicate name
      const { data: existing } = await supabase
        .from("wa_contact_segments")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("name", parsed.data.name)
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Segment name already exists" },
          { status: 409 }
        );
      }

      updates.name = parsed.data.name;
    }

    if (parsed.data.description !== undefined) {
      updates.description = parsed.data.description;
    }

    if (parsed.data.rules !== undefined) {
      updates.rules = parsed.data.rules;
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
    const parsed = deleteQuerySchema.safeParse({
      workspaceId: searchParams.get("workspaceId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "workspaceId required" },
        { status: 400 }
      );
    }

    const workspaceId = parsed.data.workspaceId;

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
