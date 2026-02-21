// =====================================================
// MARKETPLACE SHARED TYPES
// =====================================================

/** Marketplace item category */
export type MarketplaceCategory =
  | "template"
  | "prompt_pack"
  | "asset"
  | "mini_app"
  | "integration";

/** Marketplace item status lifecycle */
export type MarketplaceItemStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "rejected"
  | "archived";

/** License type for marketplace items */
export type MarketplaceLicenseType =
  | "single_use"
  | "multi_use"
  | "unlimited"
  | "subscription"
  | "free";

/** Payment status for purchases */
export type MarketplacePaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

/** Payment method */
export type MarketplacePaymentMethod =
  | "credits"
  | "xendit"
  | "midtrans";

/** Marketplace item (catalog row) */
export interface MarketplaceItem {
  id: string;
  creator_workspace_id: string;
  creator_user_id: string;
  title: string;
  slug: string;
  description: string;
  category: MarketplaceCategory;
  subcategory: string | null;
  price_usd: number; // in cents
  price_idr: number; // in rupiah
  currency: string;
  thumbnail_url: string | null;
  preview_images: string[] | null;
  demo_url: string | null;
  download_url: string | null;
  file_size_bytes: number | null;
  file_format: string | null;
  tags: string[];
  compatible_with: string[];
  version: string;
  license_type: MarketplaceLicenseType;
  downloads_count: number;
  purchases_count: number;
  views_count: number;
  rating_average: number;
  reviews_count: number;
  status: MarketplaceItemStatus;
  published_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** Marketplace purchase record */
export interface MarketplacePurchase {
  id: string;
  item_id: string;
  buyer_workspace_id: string;
  buyer_user_id: string;
  price_paid_cents: number;
  currency: string;
  platform_fee_cents: number;
  creator_earnings_cents: number;
  payment_method: MarketplacePaymentMethod;
  payment_status: MarketplacePaymentStatus;
  payment_provider_id: string | null;
  license_key: string;
  license_type: string;
  download_count: number;
  download_limit: number;
  purchased_at: string;
  refunded_at: string | null;
  refund_reason: string | null;
}

/** Marketplace purchase with joined item data */
export interface MarketplacePurchaseWithItem extends MarketplacePurchase {
  marketplace_items: {
    title: string;
    slug: string;
    category: string;
  };
}

/** Marketplace review record */
export interface MarketplaceReview {
  id: string;
  item_id: string;
  purchase_id: string;
  reviewer_workspace_id: string;
  reviewer_user_id: string;
  rating: number;
  review_text: string | null;
  creator_response: string | null;
  creator_responded_at: string | null;
  is_verified_purchase: boolean;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** Marketplace creator profile */
export interface MarketplaceCreator {
  workspace_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  total_items: number;
  total_sales: number;
  total_revenue_cents: number;
  total_earnings_cents: number;
  average_rating: number;
  is_verified: boolean;
  verified_at: string | null;
  payout_email: string | null;
  payout_method: string | null;
  payout_details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Stats summary for marketplace dashboard */
export interface MarketplaceStats {
  total_items: number;
  total_creators: number;
  total_purchases: number;
}

/** Seller dashboard stats */
export interface SellerDashboardStats {
  total_items: number;
  total_sales: number;
  total_earnings_cents: number;
  pending_review: number;
  items: MarketplaceItem[];
}

/** Commission rates */
export const MARKETPLACE_COMMISSION = {
  PLATFORM_FEE_RATE: 0.15, // 15%
  CREATOR_EARNING_RATE: 0.85, // 85%
} as const;

/** Default download limits per license type */
export const DOWNLOAD_LIMITS: Record<string, number> = {
  single_use: 3,
  multi_use: 5,
  unlimited: 999,
  subscription: 999,
  free: 3,
} as const;
