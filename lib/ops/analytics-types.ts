// Types for business analytics

export interface MetricsSnapshot {
  id: string;
  snapshot_date: string;
  period_type: "daily" | "weekly" | "monthly";
  total_mrr: number;
  new_mrr: number;
  churned_mrr: number;
  expansion_mrr: number;
  total_workspaces: number;
  active_workspaces: number;
  new_workspaces: number;
  churned_workspaces: number;
  total_users: number;
  active_users: number;
  new_users: number;
  plan_distribution: Record<string, number>;
  total_messages_sent: number;
  total_api_calls: number;
  total_tokens_used: number;
  created_at: string;
}

export interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  report_type: "revenue" | "users" | "usage" | "custom";
  query_config: ReportQueryConfig;
  created_by: string | null;
  is_shared: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportQueryConfig {
  date_range: {
    start: string;
    end: string;
  };
  filters?: Record<string, unknown>;
  grouping?: string;
  metrics?: string[];
}

export interface ExportJob {
  id: string;
  export_type: "workspaces" | "users" | "subscriptions" | "usage" | "custom";
  format: "csv" | "json" | "xlsx";
  filters: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  file_url: string | null;
  row_count: number | null;
  error_message: string | null;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface AnalyticsSummary {
  current: {
    total_workspaces: number;
    active_workspaces: number;
    total_users: number;
    total_mrr: number;
  };
  growth: {
    workspaces_change: number;
    workspaces_percent: number;
    users_change: number;
    users_percent: number;
    mrr_change: number;
    mrr_percent: number;
  };
  plan_distribution: Record<string, number>;
  recent_snapshots: MetricsSnapshot[];
}
