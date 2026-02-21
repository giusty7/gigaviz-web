/* ═════════════════════════════════════════════════════════════════════
   Inbox Types — Shared type definitions for the WhatsApp inbox UI
   ═════════════════════════════════════════════════════════════════════ */

export type Thread = {
  id: string;
  external_thread_id: string | null;
  status: string | null;
  unread_count: number | null;
  assigned_to: string | null;
  last_message_at: string | null;
  last_message_preview?: string | null;
  contact?: {
    id: string;
    display_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    labels?: string[];
    is_vip?: boolean;
  } | null;
};

export type Message = {
  id: string;
  direction: "in" | "inbound" | "out" | "outbound" | "outgoing";
  payload_json?: Record<string, unknown>;
  content_json?: Record<string, unknown>;
  text_body?: string | null;
  status?: string | null;
  outbox_id?: string | null;
  idempotency_key?: string | null;
  error_message?: string | null;
  status_at?: string | null;
  status_updated_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_at?: string | null;
  error_code?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
  external_message_id?: string | null;
  wa_message_id?: string | null;
  wa_timestamp?: string | null;
  media_url?: string | null;
  media_type?: "image" | "video" | "audio" | "document" | null;
  msg_type?: string | null;
  error_reason?: string | null;
};

export type Note = {
  id: string;
  author_id: string;
  author_name?: string;
  body: string;
  created_at: string;
};

export type ContactDetails = {
  id: string;
  display_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
  email?: string | null;
  location?: string | null;
  created_at?: string | null;
  last_seen_at?: string | null;
  labels: string[];
  is_vip: boolean;
  notes: Note[];
  activity_timeline: { type: string; description: string; timestamp: string }[];
};

export type ApprovedTemplate = {
  name: string;
  language: string | null;
  body?: string | null;
};

export type FilterState = {
  status: string;
  assigned: string;
  search: string;
  showVipOnly: boolean;
  quickTab: "all" | "unread" | "assigned";
  tags: string[];
  sortBy: "newest" | "oldest" | "recent_reply" | "unread_first";
};

export type SavedView = {
  id: string;
  name: string;
  filters: Partial<FilterState>;
  isDefault?: boolean;
  created_at?: string;
};

export type WorkspaceMember = {
  user_id: string;
  email: string;
  full_name?: string | null;
};

export type CannedResponse = {
  id: string;
  shortcut: string;
  body: string;
  category?: string;
};

export type MediaItem = {
  id: string;
  type: "image" | "video" | "document" | "audio";
  url: string;
  filename?: string;
  timestamp: string;
};

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

export type SessionInfo = {
  state: "active" | "expired" | "unknown";
  active?: boolean | null;
  remainingMinutes?: number | null;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  expiresAt?: string | null;
};

export type TelemetrySnapshot = {
  incomingToday: number;
  avgResponseMs: number | null;
  automationRate: number;
  throughput: { hour: string; count: number }[];
  slaHours: number;
  generatedAt: string;
};
