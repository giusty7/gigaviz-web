import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * POST /api/apps/requests
 * Submit a new app request
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // middleware handles session refresh
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspace_id, user_id, app_name, description, use_case, priority } = body;

    // Validate required fields
    if (!workspace_id || !user_id || !app_name || !description) {
      return NextResponse.json(
        { error: "Missing required fields: workspace_id, user_id, app_name, description" },
        { status: 400 }
      );
    }

    // Verify user is member of workspace
    const db = supabaseAdmin();
    const { data: membership } = await db
      .from("workspace_memberships")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user_id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied: You are not a member of this workspace" },
        { status: 403 }
      );
    }

    // Insert app request
    const { data: request, error } = await db
      .from("apps_requests")
      .insert({
        workspace_id,
        user_id,
        app_name,
        description,
        use_case: use_case || null,
        priority: priority || "medium",
        status: "pending",
        upvotes: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting app request:", error);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    console.error("POST /api/apps/requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
