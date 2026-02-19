import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  item_id: z.string().uuid(),
  purchase_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(2000).optional(),
});

/**
 * POST /api/marketplace/reviews
 * Submit a review for a purchased marketplace item.
 *
 * SECURITY: reviewer_workspace_id and reviewer_user_id from auth context.
 * Only allows one review per purchase (unique constraint on purchase_id).
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.cookies.get("gv_workspace_id")?.value;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  // Validate input
  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 }
    );
  }

  const { item_id, purchase_id, rating, review_text } = parsed.data;
  const db = supabaseAdmin();

  // Verify the purchase belongs to this workspace and is completed
  const { data: purchase, error: purchaseError } = await db
    .from("marketplace_purchases")
    .select("id, buyer_workspace_id, payment_status")
    .eq("id", purchase_id)
    .eq("item_id", item_id)
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  if (purchase.buyer_workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (purchase.payment_status !== "completed") {
    return NextResponse.json({ error: "Purchase not completed" }, { status: 400 });
  }

  // Check if already reviewed
  const { data: existingReview } = await db
    .from("marketplace_reviews")
    .select("id")
    .eq("purchase_id", purchase_id)
    .maybeSingle();

  if (existingReview) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  // Insert review
  const { data: review, error: insertError } = await db
    .from("marketplace_reviews")
    .insert({
      item_id,
      purchase_id,
      reviewer_workspace_id: workspaceId,
      reviewer_user_id: user.id,
      rating,
      review_text: review_text || null,
      is_verified_purchase: true,
    })
    .select()
    .single();

  if (insertError) {
    logger.error("Review insert failed", { error: insertError, workspaceId, itemId: item_id });
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }

  // Update item rating average (best-effort)
  try {
    await db.rpc("update_marketplace_item_rating", {
      p_item_id: item_id,
    });
  } catch (err) {
    logger.warn("Failed to update item rating", { error: err, itemId: item_id });
  }

  logger.info("Marketplace review submitted", {
    reviewId: review.id,
    itemId: item_id,
    rating,
    workspaceId,
  });

  return NextResponse.json({ success: true, review });
});

/**
 * GET /api/marketplace/reviews?item_id=...
 * Get reviews for a marketplace item.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("item_id");

  if (!itemId) {
    return NextResponse.json({ error: "item_id is required" }, { status: 400 });
  }

  const supabase = await supabaseServer();
  const { data: reviews, error } = await supabase
    .from("marketplace_reviews")
    .select("*")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch reviews", { error, itemId });
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }

  return NextResponse.json({ reviews: reviews ?? [] });
});
