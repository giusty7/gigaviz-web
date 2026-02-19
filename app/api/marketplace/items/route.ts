import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const marketplaceItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  price_usd: z.number().min(0).max(999999).optional().default(0), // Accepts cents from client
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  compatible_with: z.array(z.string().max(100)).max(10).optional().default([]),
  license_type: z.enum(["single_use", "multi_use", "subscription", "free"]).optional().default("single_use"),
});

/**
 * POST /api/marketplace/items
 * Create a new marketplace item
 *
 * SECURITY: workspace_id and user_id derived from auth context, never from client body.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve workspace from cookie (set by proxy middleware)
    const workspaceId = request.cookies.get("gv_workspace_id")?.value;
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from("workspace_memberships")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate input with Zod
    const body = await request.json().catch(() => null);
    const parsed = marketplaceItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid_input" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = parsed.data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + `-${Date.now().toString(36)}`;

    // Insert — workspace_id and user_id from auth context, NOT client body
    // price_usd is received in cents from client form
    const priceInCents = parsed.data.price_usd;
    const { data: item, error: insertError } = await supabase
      .from("marketplace_items")
      .insert({
        creator_workspace_id: workspaceId,
        creator_user_id: user.id,
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        category: parsed.data.category,
        subcategory: parsed.data.subcategory || null,
        price_usd: priceInCents,
        price_idr: Math.round(priceInCents * 158), // cents USD to IDR (15800 IDR/USD, /100 for cents)
        currency: "USD",
        tags: parsed.data.tags,
        compatible_with: parsed.data.compatible_with,
        license_type: parsed.data.license_type,
        status: "under_review",
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Marketplace insert error:", { error: insertError, workspaceId });
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
});

/**
 * GET /api/marketplace/items
 * List marketplace items (public, filtered by status)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const supabase = await supabaseServer();
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id");
    const status = searchParams.get("status") || "approved";

    let query = supabase
      .from("marketplace_items")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (workspace_id) {
      query = query.eq("creator_workspace_id", workspace_id);
    }

    const { data: items, error } = await query;

    if (error) {
      logger.error("Marketplace fetch error:", error);
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
});
