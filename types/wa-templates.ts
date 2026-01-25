/**
 * WhatsApp Templates System Types
 */

export type WaTemplate = {
  id: string;
  workspace_id: string;
  phone_number_id: string;
  name: string;
  language: string;
  status: string;
  category: string | null;
  body: string;
  header: string | null;
  footer: string | null;
  buttons: unknown;
  meta_template_id: string | null;
  meta_payload: unknown;
  meta_response: unknown;
  components_json: unknown;
  variable_count: number;
  has_buttons: boolean;
  quality_score: string | null;
  rejection_reason: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WaTemplateParamDef = {
  id: string;
  workspace_id: string;
  template_id: string;
  param_index: number;
  source_type: "manual" | "contact_field" | "expression";
  source_value: string | null;
  default_value: string | null;
  created_at: string;
  updated_at: string;
};

export type WaContact = {
  id: string;
  workspace_id: string;
  wa_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  tags: string[];
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WaSendJob = {
  id: string;
  workspace_id: string;
  connection_id: string;
  template_id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  total_count: number;
  queued_count: number;
  sent_count: number;
  failed_count: number;
  global_values: Record<string, string>;
  rate_limit_per_minute: number;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WaSendJobItem = {
  id: string;
  job_id: string;
  workspace_id: string;
  contact_id: string | null;
  to_phone: string;
  params: string[];
  status: "queued" | "sending" | "sent" | "failed" | "skipped";
  wa_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WaSendLog = {
  id: string;
  workspace_id: string;
  connection_id: string | null;
  template_id: string | null;
  job_id: string | null;
  job_item_id: string | null;
  to_phone_hash: string;
  template_name: string | null;
  template_language: string | null;
  params: string[];
  success: boolean;
  wa_message_id: string | null;
  http_status: number | null;
  error_message: string | null;
  response_json: Record<string, unknown> | null;
  sent_at: string;
  created_at: string;
};

export type TemplateComponent = {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type: string; text: string }>;
};

export type CreateJobRequest = {
  workspaceSlug?: string;
  workspaceId?: string;
  connectionId: string;
  templateId: string;
  name: string;
  audience: {
    tagIds?: string[];
    contactIds?: string[];
  };
  globalValues?: Record<string, string>;
  paramMapping?: Array<{
    paramIndex: number;
    sourceType: "manual" | "contact_field" | "expression";
    sourceValue?: string;
    defaultValue?: string;
  }>;
  rateLimitPerMinute?: number;
};

export type JobListResponse = {
  ok: boolean;
  jobs: Array<
    WaSendJob & {
      template?: {
        id: string;
        name: string;
        language: string;
      };
    }
  >;
};

export type JobDetailResponse = {
  ok: boolean;
  job: WaSendJob & {
    template?: {
      id: string;
      name: string;
      language: string;
      variable_count: number;
    };
  };
  items: WaSendJobItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};
