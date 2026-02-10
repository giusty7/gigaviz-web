import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

function getSupabaseClient(request: NextRequest) {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anon = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach((c) => {
          request.cookies.set(c.name, c.value);
        });
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspace_id,
      user_id,
      title,
      description,
      category,
      subcategory,
      price_usd,
      tags,
      compatible_with,
      license_type,
    } = body;

    // Validate required fields
    if (!workspace_id || !title || !description || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + `-${Date.now().toString(36)}`;

    // Insert marketplace item
    const { data: item, error: insertError } = await supabase
      .from("marketplace_items")
      .insert({
        creator_workspace_id: workspace_id,
        creator_user_id: user_id,
        title,
        slug,
        description,
        category,
        subcategory,
        price_usd: price_usd || 0,
        price_idr: Math.round((price_usd || 0) * 15), // Approximate IDR conversion
        currency: "USD",
        tags: tags || [],
        compatible_with: compatible_with || [],
        license_type: license_type || "single_use",
        status: "under_review", // Goes to review queue
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, item });
  } catch (err) {
    logger.error("Marketplace item creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id");
    const status = searchParams.get("status") || "approved";

    let query = supabase
      .from("marketplace_items")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    // Filter by creator workspace if provided
    if (workspace_id) {
      query = query.eq("creator_workspace_id", workspace_id);
    }

    const { data: items, error } = await query;

    if (error) {
      logger.error("Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items });
  } catch (err) {
    logger.error("Marketplace items fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
