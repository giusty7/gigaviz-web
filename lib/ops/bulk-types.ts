// Types for advanced operations

export interface BulkJob {
  id: string;
  operation_type: "email" | "plan_change" | "feature_toggle" | "notification";
  target_type: "workspaces" | "users" | "subscriptions";
  target_filter: Record<string, unknown>;
  target_count: number | null;
  payload: Record<string, unknown>;
  status: "draft" | "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress_current: number;
  progress_total: number;
  error_count: number;
  error_log: Array<{ target_id: string; error: string; timestamp: string }>;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  approved_by: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledAction {
  id: string;
  action_type: "plan_change" | "feature_toggle" | "suspension" | "notification";
  target_type: "workspace" | "user" | "subscription";
  target_id: string;
  payload: Record<string, unknown>;
  reason: string | null;
  scheduled_for: string;
  status: "pending" | "executed" | "cancelled" | "failed";
  executed_at: string | null;
  execution_result: Record<string, unknown> | null;
  created_by: string | null;
  cancelled_by: string | null;
  created_at: string;
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string | null;
  default_plan: string | null;
  default_entitlements: Record<string, unknown>;
  default_settings: Record<string, unknown>;
  default_modules: string[];
  is_active: boolean;
  use_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  description: string | null;
  page: string;
  filters: Record<string, unknown>;
  columns: string[] | null;
  sort_config: { field: string; direction: "asc" | "desc" } | null;
  is_default: boolean;
  is_shared: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BulkOperationPreview {
  operation_type: string;
  target_count: number;
  targets: Array<{
    id: string;
    name: string;
    current_value?: unknown;
    new_value?: unknown;
  }>;
  estimated_duration: string;
  requires_approval: boolean;
}
