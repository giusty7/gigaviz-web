/**
 * GET /api/meta/whatsapp/segments
 * List all segments
 * 
 * POST /api/meta/whatsapp/segments
 * Create a new segment
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { CreateSegmentRequest, ContactSegment } from "@/types/wa-contacts";

export async function GET(request: NextRequest) {
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
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[Segments API GET] Membership query error:", {
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
      console.warn("[Segments API GET] Access denied:", {
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
      console.error("[Segments API] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ segments: segments || [] });
  } catch (error) {
    console.error("[Segments API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as CreateSegmentRequest & {
      workspaceId: string;
    };

    if (!body.workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Segment name required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", body.workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[Segments API POST] Membership query error:", {
        error: membershipError,
        workspaceId: body.workspaceId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Database error checking workspace access" },
        { status: 500 }
      );
    }

    if (!membership) {
      console.warn("[Segments API POST] Access denied:", {
        workspaceId: body.workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("wa_contact_segments")
      .select("id")
      .eq("workspace_id", body.workspaceId)
      .eq("name", body.name)
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
        workspace_id: body.workspaceId,
        name: body.name,
        description: body.description || null,
        rules: body.rules || {},
      })
      .select()
      .single();

    if (error) {
      console.error("[Segments API] Create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(segment as ContactSegment, { status: 201 });
  } catch (error) {
    console.error("[Segments API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
