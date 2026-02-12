/**
 * GET /api/meta/whatsapp/segments
 * List all segments
 * 
 * POST /api/meta/whatsapp/segments
 * Create a new segment
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import type { ContactSegment } from "@/types/wa-contacts";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const getQuerySchema = z.object({
  workspaceId: z.string().uuid("Invalid workspaceId"),
});

const createSegmentSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspaceId"),
  name: z.string().min(1, "Segment name required").max(200),
  description: z.string().max(2000).optional(),
  rules: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const supabase = await supabaseServer();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parsed = getQuerySchema.safeParse({
      workspaceId: searchParams.get("workspaceId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "workspaceId required" },
        { status: 400 }
      );
    }

    const workspaceId = parsed.data.workspaceId;

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Segments API GET] Membership query error:", {
        error: membershipError,
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      logger.warn("[Segments API GET] Access denied:", {
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get segments
    const { data: segments, error } = await supabase
      .from("wa_contact_segments")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("[Segments API] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ segments: segments || [] });
  } catch (error) {
    logger.error("[Segments API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const supabase = await supabaseServer();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = createSegmentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid_input" },
        { status: 400 }
      );
    }

    const { workspaceId, name, description, rules } = parsed.data;

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("[Segments API POST] Membership query error:", {
        error: membershipError,
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      logger.warn("[Segments API POST] Access denied:", {
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("wa_contact_segments")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Segment name already exists" },
        { status: 409 }
      );
    }

    // Create segment
    const { data: segment, error } = await supabase
      .from("wa_contact_segments")
      .insert({
        workspace_id: workspaceId,
        name,
        description: description || null,
        rules: rules || {},
      })
      .select()
      .single();

    if (error) {
      logger.error("[Segments API] Create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(segment as ContactSegment, { status: 201 });
  } catch (error) {
    logger.error("[Segments API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
