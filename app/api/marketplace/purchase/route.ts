import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const purchaseSchema = z.object({
  item_id: z.string().uuid(),
});

/**
 * POST /api/marketplace/purchase
 * Purchase a marketplace item using token credits.
 *
 * SECURITY: buyer_workspace_id and buyer_user_id derived from auth context.
 * Uses service role for insert (RLS INSERT policy on marketplace_purchases).
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve workspace from cookie
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

  // Validate input
  const body = await request.json().catch(() => null);
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 }
    );
  }

  const { item_id } = parsed.data;

  // Fetch the item (use service role to bypass RLS for all statuses)
  const db = supabaseAdmin();
  const { data: item, error: itemError } = await db
    .from("marketplace_items")
    .select("*")
    .eq("id", item_id)
    .eq("status", "approved")
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Item not found or not available" }, { status: 404 });
  }

  // Prevent purchasing your own item
  if (item.creator_workspace_id === workspaceId) {
    return NextResponse.json({ error: "Cannot purchase your own item" }, { status: 400 });
  }

  // Check for existing purchase (prevent duplicates)
  const { data: existingPurchase } = await db
    .from("marketplace_purchases")
    .select("id")
    .eq("item_id", item_id)
    .eq("buyer_workspace_id", workspaceId)
    .eq("payment_status", "completed")
    .maybeSingle();

  if (existingPurchase) {
    return NextResponse.json({ error: "Already purchased" }, { status: 409 });
  }

  // Token deduction for non-free items
  if (item.price_usd > 0) {
    try {
      const { consumeTokens } = await import("@/lib/tokens");
      await consumeTokens(workspaceId, item.price_usd, {
        feature_key: "marketplace",
        ref_type: "marketplace_purchase",
        ref_id: item_id,
        note: `Purchase: ${item.title}`,
        created_by: user.id,
      });
    } catch (tokenError) {
      logger.error("Token deduction failed for marketplace purchase", {
        error: tokenError,
        workspaceId,
        itemId: item_id,
      });
      return NextResponse.json(
        { error: "Insufficient tokens or token deduction failed" },
        { status: 402 }
      );
    }
  }

  // Calculate commission split
  const pricePaidCents = item.price_usd; // Already in cents
  const platformFeeCents = Math.round(pricePaidCents * 0.15);
  const creatorEarningsCents = pricePaidCents - platformFeeCents;

  // Create purchase record (use service role to bypass RLS)
  const { data: purchase, error: purchaseError } = await db
    .from("marketplace_purchases")
    .insert({
      item_id,
      buyer_workspace_id: workspaceId,
      buyer_user_id: user.id,
      price_paid_cents: pricePaidCents,
      currency: item.currency,
      platform_fee_cents: platformFeeCents,
      creator_earnings_cents: creatorEarningsCents,
      payment_method: "credits",
      payment_status: "completed",
      license_type: item.license_type,
      download_count: 0,
      download_limit: item.license_type === "unlimited" ? 999 : item.license_type === "multi_use" ? 5 : 3,
    })
    .select()
    .single();

  if (purchaseError) {
    logger.error("Marketplace purchase insert failed", {
      error: purchaseError,
      workspaceId,
      itemId: item_id,
    });
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }

  // Update item stats
  await db
    .from("marketplace_items")
    .update({
      purchases_count: (item.purchases_count || 0) + 1,
    })
    .eq("id", item_id);

  // Increment creator stats atomically (best-effort)
  try {
    await db.rpc("increment_marketplace_creator_stats", {
      p_workspace_id: item.creator_workspace_id,
      p_sales: 1,
      p_revenue: pricePaidCents,
      p_earnings: creatorEarningsCents,
    });
  } catch {
    logger.warn("Failed to increment creator stats", {
      creatorWorkspaceId: item.creator_workspace_id,
    });
  }

  logger.info("Marketplace purchase completed", {
    purchaseId: purchase.id,
    itemId: item_id,
    buyerWorkspaceId: workspaceId,
    pricePaidCents,
  });

  return NextResponse.json({
    success: true,
    purchase: {
      id: purchase.id,
      license_key: purchase.license_key,
      download_limit: purchase.download_limit,
    },
  });
});
