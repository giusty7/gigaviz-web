/**
 * Shared API types — centralized to eliminate duplication across 72+ route files.
 *
 * Import from "@/types/api-common" instead of defining inline types.
 */

/** Standard Next.js dynamic route context with single param */
export type RouteContext<T extends string = "id"> = {
  params: Promise<Record<T, string>>;
};

/** Common API response wrapper */
export type ApiResponse<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
  requestId?: string;
};

/** Paginated API response */
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

/** Standard message row from inbox_messages / outbox_messages */
export type MessageRow = {
  id: string;
  workspace_id: string;
  thread_id: string | null;
  contact_id: string | null;
  direction: "inbound" | "outbound";
  channel: string;
  content: string | null;
  content_type: string | null;
  media_url: string | null;
  media_type: string | null;
  wa_message_id: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** Standard contact row from wa_contacts */
export type ContactRow = {
  id: string;
  workspace_id: string;
  normalized_phone: string;
  wa_id: string | null;
  display_name: string | null;
  phone: string | null;
  profile_name: string | null;
  email: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  opt_in_status: "unknown" | "opted_in" | "opted_out";
  source: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Standard thread row from threads */
export type ThreadRow = {
  id: string;
  workspace_id: string;
  contact_id: string | null;
  channel: string;
  status: string;
  priority: string | null;
  assignee_id: string | null;
  tags: string[];
  subject: string | null;
  last_message_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** Attachment row */
export type AttachmentRow = {
  id: string;
  workspace_id: string;
  thread_id: string | null;
  message_id: string | null;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  url: string;
  storage_path: string | null;
  created_at: string;
};

/** Note row for CRM / thread notes */
export type NoteRow = {
  id: string;
  workspace_id: string;
  thread_id: string | null;
  contact_id: string | null;
  author_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

/** Custom field type */
export type FieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multiselect"
  | "url"
  | "email"
  | "phone";
