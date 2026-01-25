/**
 * WhatsApp Contacts & Audience Management Types
 */

export type OptInStatus = "unknown" | "opted_in" | "opted_out";

export interface WaContact {
  id: string;
  workspace_id: string;
  normalized_phone: string;
  display_name?: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  opt_in_status: OptInStatus;
  opt_in_at?: string | null;
  opt_out_at?: string | null;
  source?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
  // Legacy fields (may exist)
  wa_id?: string | null;
  phone?: string | null;
  profile_name?: string | null;
}

export interface ContactSegment {
  id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  rules: SegmentRules;
  created_at: string;
  updated_at: string;
}

export interface SegmentRules {
  includeTags?: string[];
  excludeTags?: string[];
  customFieldFilters?: CustomFieldFilter[];
  optInOnly?: boolean;
}

export interface CustomFieldFilter {
  field: string;
  operator: "equals" | "contains" | "exists";
  value?: string;
}

// API Request/Response types

export interface CreateContactRequest {
  phone: string; // Will be normalized
  display_name?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  opt_in_status?: OptInStatus;
  source?: string;
}

export interface UpdateContactRequest {
  display_name?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  opt_in_status?: OptInStatus;
}

export interface BulkPasteRequest {
  lines: string[]; // One phone per line, optionally: "phone,name"
  tags?: string[];
  source?: string;
}

export interface BulkPasteResponse {
  valid: number;
  invalid: number;
  duplicates: number;
  created: string[];
  errors: { line: string; error: string }[];
}

export interface CSVImportMapping {
  phoneColumn: string;
  nameColumn?: string;
  tagColumns?: string[];
  customFieldMappings?: { csvColumn: string; fieldName: string }[];
}

export interface CSVImportRequest {
  csvData: string; // CSV as string
  mapping: CSVImportMapping;
  tags?: string[]; // Additional tags to apply
  source?: string;
}

export interface CSVImportResponse {
  valid: number;
  invalid: number;
  duplicates: number;
  created: string[];
  errors: { row: number; error: string }[];
}

export interface ContactsListParams {
  search?: string;
  tag?: string;
  segmentId?: string;
  optInStatus?: OptInStatus;
  page?: number;
  limit?: number;
}

export interface ContactsListResponse {
  contacts: WaContact[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSegmentRequest {
  name: string;
  description?: string;
  rules: SegmentRules;
}

export interface UpdateSegmentRequest {
  name?: string;
  description?: string;
  rules?: SegmentRules;
}

export interface AudiencePreviewRequest {
  tags?: string[];
  segmentId?: string;
  rules?: SegmentRules;
}

export interface AudiencePreviewResponse {
  count: number;
  sample: WaContact[];
  estimation: {
    opted_in: number;
    opted_out: number;
    unknown: number;
  };
}

// UI State types

export interface ContactFormData {
  phone: string;
  display_name: string;
  tags: string[];
  custom_fields: Array<{ key: string; value: string }>;
  opt_in_status: OptInStatus;
}

export interface SegmentFormData {
  name: string;
  description: string;
  includeTags: string[];
  excludeTags: string[];
  customFieldFilters: CustomFieldFilter[];
  optInOnly: boolean;
}
