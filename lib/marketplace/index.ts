import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import type {
  MarketplaceItem,
  MarketplacePurchaseWithItem,
  MarketplaceCreator,
  MarketplaceStats,
  SellerDashboardStats,
} from "@/types/marketplace";
import { MARKETPLACE_COMMISSION, DOWNLOAD_LIMITS } from "@/types/marketplace";

// ─── Public Catalog ─────────────────────────────────────────────────

/**
 * Fetch approved marketplace items with optional filters.
 */
export async function getMarketplaceItems(options?: {
  category?: string;
  search?: string;
  sortBy?: "popular" | "newest" | "price_asc" | "price_desc" | "rating";
  freeOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<MarketplaceItem[]> {
  const supabase = await supabaseServer();
  let query = supabase
    .from("marketplace_items")
    .select("*")
    .eq("status", "approved");

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.freeOnly) {
    query = query.eq("price_usd", 0);
  }

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,description.ilike.%${options.search}%,tags.cs.{${options.search}}`
    );
  }

  switch (options?.sortBy) {
    case "popular":
      query = query.order("purchases_count", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price_asc":
      query = query.order("price_usd", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_usd", { ascending: false });
      break;
    case "rating":
      query = query.order("rating_average", { ascending: false });
      break;
    default:
      query = query.order("purchases_count", { ascending: false });
  }

  query = query.limit(options?.limit ?? 50);
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("Failed to fetch marketplace items", { error, options });
    return [];
  }
  return (data ?? []) as MarketplaceItem[];
}

/**
 * Get a single marketplace item by slug.
 */
export async function getMarketplaceItemBySlug(
  slug: string
): Promise<MarketplaceItem | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as MarketplaceItem;
}

// ─── Marketplace Stats ──────────────────────────────────────────────

/**
 * Get aggregate marketplace statistics.
 */
export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const supabase = await supabaseServer();

  const [items, creators, purchases] = await Promise.all([
    supabase
      .from("marketplace_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("marketplace_creators")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("marketplace_purchases")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    total_items: items.count ?? 0,
    total_creators: creators.count ?? 0,
    total_purchases: purchases.count ?? 0,
  };
}

// ─── Seller Dashboard ───────────────────────────────────────────────

/**
 * Get seller dashboard data for a workspace.
 */
export async function getSellerDashboard(
  workspaceId: string
): Promise<SellerDashboardStats> {
  const supabase = await supabaseServer();

  // Fetch creator's items
  const { data: items } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("creator_workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  const allItems = (items ?? []) as MarketplaceItem[];

  // Compute stats
  const totalSales = allItems.reduce((sum, item) => sum + item.purchases_count, 0);
  const pendingReview = allItems.filter((i) => i.status === "under_review").length;

  // Get creator earnings
  const { data: creator } = await supabase
    .from("marketplace_creators")
    .select("total_earnings_cents")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return {
    total_items: allItems.length,
    total_sales: totalSales,
    total_earnings_cents: (creator as MarketplaceCreator | null)?.total_earnings_cents ?? 0,
    pending_review: pendingReview,
    items: allItems,
  };
}

// ─── Purchase Helpers ───────────────────────────────────────────────

/**
 * Get purchases for a workspace (buyer view).
 */
export async function getWorkspacePurchases(
  workspaceId: string
): Promise<MarketplacePurchaseWithItem[]> {
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("marketplace_purchases")
    .select(`
      *,
      marketplace_items (title, slug, category)
    `)
    .eq("buyer_workspace_id", workspaceId)
    .order("purchased_at", { ascending: false });

  return (data ?? []) as unknown as MarketplacePurchaseWithItem[];
}

/**
 * Check if a workspace has purchased an item.
 */
export async function hasWorkspacePurchased(
  workspaceId: string,
  itemId: string
): Promise<boolean> {
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("marketplace_purchases")
    .select("id")
    .eq("item_id", itemId)
    .eq("buyer_workspace_id", workspaceId)
    .eq("payment_status", "completed")
    .maybeSingle();

  return !!data;
}

// ─── Commission Calculation ─────────────────────────────────────────

/**
 * Calculate commission split for a given price in cents.
 */
export function calculateCommission(priceCents: number) {
  const platformFeeCents = Math.round(priceCents * MARKETPLACE_COMMISSION.PLATFORM_FEE_RATE);
  const creatorEarningsCents = priceCents - platformFeeCents;
  return { platformFeeCents, creatorEarningsCents };
}

/**
 * Get download limit for a license type.
 */
export function getDownloadLimit(licenseType: string): number {
  return DOWNLOAD_LIMITS[licenseType] ?? 3;
}

// ─── Admin Operations ───────────────────────────────────────────────

/**
 * Approve or reject a marketplace item (admin/ops only).
 */
export async function moderateItem(
  itemId: string,
  action: "approve" | "reject",
  reason?: string
): Promise<boolean> {
  const db = supabaseAdmin();

  const updateData: Record<string, unknown> = {
    status: action === "approve" ? "approved" : "rejected",
    updated_at: new Date().toISOString(),
  };

  if (action === "approve") {
    updateData.published_at = new Date().toISOString();
  }
  if (action === "reject" && reason) {
    updateData.rejected_reason = reason;
  }

  const { error } = await db
    .from("marketplace_items")
    .update(updateData)
    .eq("id", itemId);

  if (error) {
    logger.error("Failed to moderate marketplace item", { error, itemId, action });
    return false;
  }

  // Update creator item count on approval
  if (action === "approve") {
    const { data: item } = await db
      .from("marketplace_items")
      .select("creator_workspace_id")
      .eq("id", itemId)
      .single();

    if (item) {
      try {
        await db.rpc("increment_marketplace_creator_stats", {
          p_workspace_id: item.creator_workspace_id,
          p_sales: 0,
          p_revenue: 0,
          p_earnings: 0,
        });
      } catch {
        // Best effort
      }
    }
  }

  logger.info("Marketplace item moderated", { itemId, action, reason });
  return true;
}
