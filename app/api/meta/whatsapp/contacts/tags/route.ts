/**
 * GET /api/meta/whatsapp/contacts/tags
 * List all distinct tags in workspace
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

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
      console.error("[Contacts Tags API] Membership query error:", {
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
      console.warn("[Contacts Tags API] Access denied:", {
        workspaceId,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all contacts with tags
    const { data: contacts } = await supabase
      .from("wa_contacts")
      .select("tags")
      .eq("workspace_id", workspaceId);

    if (!contacts) {
      return NextResponse.json({ tags: [] });
    }

    // Flatten and dedupe tags
    const tagsSet = new Set<string>();
    for (const contact of contacts) {
      if (contact.tags && Array.isArray(contact.tags)) {
        for (const tag of contact.tags) {
          tagsSet.add(tag);
        }
      }
    }

    const tags = Array.from(tagsSet).sort();

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[Tags API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
