import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const updateItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(4000).optional(),
  category: z.string().min(1).max(100).optional(),
  subcategory: z.string().max(100).nullable().optional(),
  price_usd: z.number().min(0).max(999999).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  compatible_with: z.array(z.string().max(100)).max(10).optional(),
  license_type: z.enum(["single_use", "multi_use", "subscription", "free"]).optional(),
});

/**
 * GET /api/marketplace/items/[itemId]
 * Get a single marketplace item by ID
 */
export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) => {
  const { itemId } = await params;
  const supabase = await supabaseServer();

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
});

/**
 * PATCH /api/marketplace/items/[itemId]
 * Update a marketplace item (creator only)
 *
 * SECURITY: Only the creator workspace can update their own items.
 */
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) => {
  const { itemId } = await params;
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.cookies.get("gv_workspace_id")?.value;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  // Verify the item belongs to this workspace
  const db = supabaseAdmin();
  const { data: item, error: itemError } = await db
    .from("marketplace_items")
    .select("id, creator_workspace_id, status")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.creator_workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate input
  const body = await request.json().catch(() => null);
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 }
    );
  }

  // Build update payload
  const updateData: Record<string, unknown> = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  // If price changes, recalculate IDR
  if (parsed.data.price_usd !== undefined) {
    updateData.price_idr = Math.round(parsed.data.price_usd * 158);
  }

  // If item was rejected and is being edited, set back to under_review
  if (item.status === "rejected" || item.status === "draft") {
    updateData.status = "under_review";
  }

  const { data: updated, error: updateError } = await db
    .from("marketplace_items")
    .update(updateData)
    .eq("id", itemId)
    .select()
    .single();

  if (updateError) {
    logger.error("Marketplace item update failed", { error: updateError, itemId, workspaceId });
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }

  logger.info("Marketplace item updated", { itemId, workspaceId, changes: Object.keys(parsed.data) });
  return NextResponse.json({ success: true, item: updated });
});

/**
 * DELETE /api/marketplace/items/[itemId]
 * Delete a marketplace item (creator only, if no purchases)
 *
 * SECURITY: Only the creator workspace can delete their items.
 * Items with existing purchases cannot be deleted (only archived).
 */
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) => {
  const { itemId } = await params;
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.cookies.get("gv_workspace_id")?.value;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Verify item ownership
  const { data: item, error: itemError } = await db
    .from("marketplace_items")
    .select("id, creator_workspace_id, purchases_count")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.creator_workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If item has purchases, archive instead of delete
  if (item.purchases_count > 0) {
    await db
      .from("marketplace_items")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", itemId);

    logger.info("Marketplace item archived (has purchases)", { itemId, workspaceId });
    return NextResponse.json({ success: true, action: "archived" });
  }

  // Delete item (no purchases)
  const { error: deleteError } = await db
    .from("marketplace_items")
    .delete()
    .eq("id", itemId);

  if (deleteError) {
    logger.error("Marketplace item delete failed", { error: deleteError, itemId, workspaceId });
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }

  logger.info("Marketplace item deleted", { itemId, workspaceId });
  return NextResponse.json({ success: true, action: "deleted" });
});
