import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  MetricsSnapshot,
  SavedReport,
  ExportJob,
  AnalyticsSummary,
} from "./analytics-types";

// ============================================================================
// METRICS SNAPSHOTS
// ============================================================================

export async function getMetricsSnapshots(options: {
  periodType?: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<MetricsSnapshot[]> {
  const db = supabaseAdmin();
  let query = db
    .from("ops_metrics_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false });

  if (options.periodType) {
    query = query.eq("period_type", options.periodType);
  }
  if (options.startDate) {
    query = query.gte("snapshot_date", options.startDate);
  }
  if (options.endDate) {
    query = query.lte("snapshot_date", options.endDate);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function generateDailySnapshot(
  targetDate?: string
): Promise<string> {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("ops_generate_daily_snapshot", {
    target_date: targetDate || undefined,
  });

  if (error) throw error;
  return data;
}

// ============================================================================
// ANALYTICS SUMMARY
// ============================================================================

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const db = supabaseAdmin();

  // Get current totals
  const [workspacesResult, usersResult, subscriptionsResult] =
    await Promise.all([
      db.from("workspaces").select("id, created_at, updated_at", { count: "exact" }),
      db.from("profiles").select("id, created_at", { count: "exact" }),
      db.from("subscriptions").select("plan_id").eq("status", "active"),
    ]);

  const totalWorkspaces = workspacesResult.count || 0;
  const totalUsers = usersResult.count || 0;

  // Calculate active workspaces (updated in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeWorkspaces =
    workspacesResult.data?.filter(
      (w: { updated_at: string }) => new Date(w.updated_at) > thirtyDaysAgo
    ).length || 0;

  // Plan distribution
  const planDist: Record<string, number> = {};
  subscriptionsResult.data?.forEach((s: { plan_id: string | null }) => {
    const plan = s.plan_id || "free";
    planDist[plan] = (planDist[plan] || 0) + 1;
  });

  // Get recent snapshots for trend
  const recentSnapshots = await getMetricsSnapshots({
    periodType: "daily",
    limit: 30,
  });

  // Calculate growth (compare to 30 days ago)
  const oldSnapshot = recentSnapshots[recentSnapshots.length - 1];
  const growth = {
    workspaces_change: oldSnapshot
      ? totalWorkspaces - oldSnapshot.total_workspaces
      : 0,
    workspaces_percent: oldSnapshot
      ? ((totalWorkspaces - oldSnapshot.total_workspaces) /
          (oldSnapshot.total_workspaces || 1)) *
        100
      : 0,
    users_change: oldSnapshot ? totalUsers - oldSnapshot.total_users : 0,
    users_percent: oldSnapshot
      ? ((totalUsers - oldSnapshot.total_users) /
          (oldSnapshot.total_users || 1)) *
        100
      : 0,
    mrr_change: 0,
    mrr_percent: 0,
  };

  return {
    current: {
      total_workspaces: totalWorkspaces,
      active_workspaces: activeWorkspaces,
      total_users: totalUsers,
      total_mrr: 0, // Would need billing integration
    },
    growth,
    plan_distribution: planDist,
    recent_snapshots: recentSnapshots.slice(0, 7),
  };
}

// ============================================================================
// SAVED REPORTS
// ============================================================================

export async function getSavedReports(userId?: string): Promise<SavedReport[]> {
  const db = supabaseAdmin();
  let query = db
    .from("ops_saved_reports")
    .select("*")
    .order("updated_at", { ascending: false });

  if (userId) {
    query = query.or(`created_by.eq.${userId},is_shared.eq.true`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createSavedReport(
  report: Omit<SavedReport, "id" | "created_at" | "updated_at" | "last_run_at">
): Promise<SavedReport> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_saved_reports")
    .insert(report)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSavedReport(id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("ops_saved_reports").delete().eq("id", id);

  if (error) throw error;
}

// ============================================================================
// EXPORT JOBS
// ============================================================================

export async function getExportJobs(options: {
  status?: ExportJob["status"];
  limit?: number;
}): Promise<ExportJob[]> {
  const db = supabaseAdmin();
  let query = db
    .from("ops_export_jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createExportJob(
  job: Pick<ExportJob, "export_type" | "format" | "filters" | "created_by">
): Promise<ExportJob> {
  const db = supabaseAdmin();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

  const { data, error } = await db
    .from("ops_export_jobs")
    .insert({
      ...job,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExportJob(
  id: string,
  updates: Partial<ExportJob>
): Promise<ExportJob> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_export_jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// EXPORT DATA GENERATORS
// ============================================================================

export async function generateWorkspacesExport(
  filters: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  const db = supabaseAdmin();
  let query = db.from("workspaces").select(`
      id,
      name,
      slug,
      created_at,
      updated_at
    `);

  // Apply filters
  if (filters.created_after) {
    query = query.gte("created_at", filters.created_after);
  }
  if (filters.created_before) {
    query = query.lte("created_at", filters.created_before);
  }

  const { data, error } = await query.limit(10000);
  if (error) throw error;
  return data || [];
}

export async function generateUsersExport(
  filters: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  const db = supabaseAdmin();
  let query = db.from("profiles").select(`
      id,
      email,
      full_name,
      created_at
    `);

  if (filters.created_after) {
    query = query.gte("created_at", filters.created_after);
  }
  if (filters.created_before) {
    query = query.lte("created_at", filters.created_before);
  }

  const { data, error } = await query.limit(10000);
  if (error) throw error;
  return data || [];
}
