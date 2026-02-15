/* ─── Gigaviz Links — shared types ─── */

export interface LinkPage {
  id: string;
  workspace_id: string;
  slug: string;
  title: string;
  bio: string | null;
  avatar_url: string | null;
  theme: LinkPageTheme;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkPageTheme {
  bg: string;
  text: string;
  accent: string;
  buttonStyle: "filled" | "outline" | "soft";
  radius: "none" | "sm" | "md" | "lg" | "full";
}

export interface LinkItem {
  id: string;
  page_id: string;
  workspace_id: string;
  title: string;
  url: string | null;
  link_type: "url" | "whatsapp" | "product" | "heading" | "social";
  icon: string | null;
  thumbnail_url: string | null;
  metadata: LinkItemMetadata;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

/** Type-specific metadata */
export type LinkItemMetadata =
  | WhatsAppMetadata
  | ProductMetadata
  | SocialMetadata
  | Record<string, unknown>;

export interface WhatsAppMetadata {
  phone: string;       // e.g. "+628123456789"
  message?: string;    // pre-filled message
  agent_id?: string;   // route to specific agent
}

export interface ProductMetadata {
  price?: number;
  currency?: string;   // "IDR", "USD"
  description?: string;
  image_url?: string;
}

export interface SocialMetadata {
  platform?: string;   // "instagram", "tiktok", "youtube", etc.
}

export interface LinkClick {
  id: string;
  item_id: string;
  page_id: string;
  workspace_id: string;
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  ip_hash: string | null;
  session_id: string | null;
}

/** Analytics summary for a page */
export interface LinkPageAnalytics {
  page_id: string;
  total_clicks: number;
  unique_visitors: number;
  top_items: { item_id: string; title: string; clicks: number }[];
  clicks_by_day: { date: string; clicks: number }[];
  devices: { device_type: string; count: number }[];
}
