import "server-only";

import { logger } from "@/lib/logging";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Quota keys used across the platform
export type QuotaKey =
  | "wa_messages_monthly"
  | "ai_tokens_monthly"
  | "storage_bytes"
  | "helper_conversations_monthly";

// Metric keys for trend tracking
export type MetricKey =
  | "wa_messages_sent"
  | "wa_messages_received"
  | "ai_tokens_consumed"
  | "helper_conversations"
  | "storage_used";

// Default quotas per plan (new 5-tier system + legacy aliases)
export const PLAN_QUOTAS: Record<string, Record<QuotaKey, number>> = {
  // ── New plan tiers ──────────────────────────────────────────
  free: {
    wa_messages_monthly: 100,
    ai_tokens_monthly: 10_000,
    storage_bytes: 100 * 1024 * 1024, // 100 MB
    helper_conversations_monthly: 10,
  },
  starter: {
    wa_messages_monthly: 2_000,
    ai_tokens_monthly: 50_000,
    storage_bytes: 500 * 1024 * 1024, // 500 MB
    helper_conversations_monthly: 50,
  },
  growth: {
    wa_messages_monthly: 10_000,
    ai_tokens_monthly: 200_000,
    storage_bytes: 2 * 1024 * 1024 * 1024, // 2 GB
    helper_conversations_monthly: 200,
  },
  business: {
    wa_messages_monthly: 50_000,
    ai_tokens_monthly: 1_000_000,
    storage_bytes: 10 * 1024 * 1024 * 1024, // 10 GB
    helper_conversations_monthly: 1000,
  },
  enterprise: {
    wa_messages_monthly: 200_000,
    ai_tokens_monthly: 5_000_000,
    storage_bytes: 50 * 1024 * 1024 * 1024, // 50 GB
    helper_conversations_monthly: 5000,
  },

  // ── Legacy aliases (backward compat) ────────────────────────
  free_locked: {
    wa_messages_monthly: 100,
    ai_tokens_monthly: 10_000,
    storage_bytes: 100 * 1024 * 1024,
    helper_conversations_monthly: 10,
  },
  individual: {
    wa_messages_monthly: 5_000,
    ai_tokens_monthly: 100_000,
    storage_bytes: 1024 * 1024 * 1024,
    helper_conversations_monthly: 100,
  },
  ind_starter: {
    wa_messages_monthly: 2_000,
    ai_tokens_monthly: 50_000,
    storage_bytes: 500 * 1024 * 1024,
    helper_conversations_monthly: 50,
  },
  ind_pro: {
    wa_messages_monthly: 10_000,
    ai_tokens_monthly: 200_000,
    storage_bytes: 2 * 1024 * 1024 * 1024,
    helper_conversations_monthly: 200,
  },
  team: {
    wa_messages_monthly: 50_000,
    ai_tokens_monthly: 1_000_000,
    storage_bytes: 10 * 1024 * 1024 * 1024,
    helper_conversations_monthly: 1000,
  },
  team_starter: {
    wa_messages_monthly: 10_000,
    ai_tokens_monthly: 200_000,
    storage_bytes: 2 * 1024 * 1024 * 1024,
    helper_conversations_monthly: 200,
  },
  team_pro: {
    wa_messages_monthly: 50_000,
    ai_tokens_monthly: 1_000_000,
    storage_bytes: 10 * 1024 * 1024 * 1024,
    helper_conversations_monthly: 1000,
  },
};

export type QuotaStatus = {
  quotaKey: QuotaKey;
  limit: number;
  used: number;
  percentage: number;
};

export type MetricTrendPoint = {
  day: string;
  value: number;
};

/**
 * Seed default quotas for a workspace based on plan
 */
export async function seedWorkspaceQuotas(
  workspaceId: string,
  planId: string = "free_locked"
): Promise<void> {
  const db = supabaseAdmin();
  const quotas = PLAN_QUOTAS[planId] ?? PLAN_QUOTAS.free_locked;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const rows = Object.entries(quotas).map(([key, limit]) => ({
    workspace_id: workspaceId,
    quota_key: key,
    quota_limit: limit,
    quota_used: 0,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
  }));

  const { error } = await db.from("workspace_quotas").upsert(rows, {
    onConflict: "workspace_id,quota_key,period_start",
  });

  if (error && process.env.NODE_ENV === "development") {
    logger.warn("[quotas] seed failed", error);
  }
}

/**
 * Get current quota status for a workspace
 */
export async function getQuotaStatus(
  workspaceId: string,
  quotaKey: QuotaKey
): Promise<QuotaStatus | null> {
  const db = supabaseAdmin();
  const now = new Date();

  const { data, error } = await db
    .from("workspace_quotas")
    .select("quota_limit, quota_used")
    .eq("workspace_id", workspaceId)
    .eq("quota_key", quotaKey)
    .gte("period_end", now.toISOString())
    .lte("period_start", now.toISOString())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const limit = Number(data.quota_limit);
  const used = Number(data.quota_used);
  const percentage = limit > 0 ? Math.round((used / limit) * 100 * 10) / 10 : 0;

  return {
    quotaKey,
    limit,
    used,
    percentage,
  };
}

/**
 * Get all quota statuses for a workspace
 */
export async function getAllQuotaStatuses(
  workspaceId: string
): Promise<QuotaStatus[]> {
  const db = supabaseAdmin();
  const now = new Date();

  const { data, error } = await db
    .from("workspace_quotas")
    .select("quota_key, quota_limit, quota_used")
    .eq("workspace_id", workspaceId)
    .gte("period_end", now.toISOString())
    .lte("period_start", now.toISOString());

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const limit = Number(row.quota_limit);
    const used = Number(row.quota_used);
    const percentage = limit > 0 ? Math.round((used / limit) * 100 * 10) / 10 : 0;
    return {
      quotaKey: row.quota_key as QuotaKey,
      limit,
      used,
      percentage,
    };
  });
}

/**
 * Increment quota usage
 */
export async function incrementQuotaUsage(
  workspaceId: string,
  quotaKey: QuotaKey,
  amount: number = 1
): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.rpc("increment_quota_usage", {
    p_workspace_id: workspaceId,
    p_quota_key: quotaKey,
    p_amount: amount,
  });

  if (error && process.env.NODE_ENV === "development") {
    logger.warn("[quotas] increment failed", error);
  }
}

/**
 * Record a metric snapshot
 */
export async function recordMetric(
  workspaceId: string,
  metricKey: MetricKey,
  value: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("workspace_metrics").insert({
    workspace_id: workspaceId,
    metric_key: metricKey,
    metric_value: value,
    metadata: metadata ?? null,
  });

  if (error && process.env.NODE_ENV === "development") {
    logger.warn("[metrics] record failed", error);
  }
}

/**
 * Get metric trend for last N days
 */
export async function getMetricTrend(
  workspaceId: string,
  metricKey: MetricKey,
  days: number = 7
): Promise<MetricTrendPoint[]> {
  const db = supabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await db
    .from("workspace_metrics")
    .select("metric_value, recorded_at")
    .eq("workspace_id", workspaceId)
    .eq("metric_key", metricKey)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  // Aggregate by day
  const byDay: Record<string, number> = {};
  for (const row of data) {
    const day = row.recorded_at.split("T")[0];
    byDay[day] = (byDay[day] ?? 0) + Number(row.metric_value);
  }

  return Object.entries(byDay).map(([day, value]) => ({ day, value }));
}

/**
 * Get aggregated metrics summary for dashboard
 */
export async function getDashboardMetrics(workspaceId: string): Promise<{
  waMessagesSent7d: number;
  aiTokensUsed7d: number;
  helperConversations7d: number;
}> {
  const db = supabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await db
    .from("workspace_metrics")
    .select("metric_key, metric_value")
    .eq("workspace_id", workspaceId)
    .gte("recorded_at", since.toISOString());

  if (error || !data) {
    return {
      waMessagesSent7d: 0,
      aiTokensUsed7d: 0,
      helperConversations7d: 0,
    };
  }

  let waMessagesSent7d = 0;
  let aiTokensUsed7d = 0;
  let helperConversations7d = 0;

  for (const row of data) {
    const value = Number(row.metric_value);
    if (row.metric_key === "wa_messages_sent") waMessagesSent7d += value;
    if (row.metric_key === "ai_tokens_consumed") aiTokensUsed7d += value;
    if (row.metric_key === "helper_conversations") helperConversations7d += value;
  }

  return { waMessagesSent7d, aiTokensUsed7d, helperConversations7d };
}
