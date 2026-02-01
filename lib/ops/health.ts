import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  HealthCheckType,
  HealthStatus,
  LatestHealthStatus,
  SystemOverview,
  StaleWorker,
} from "./health-types";

/**
 * Get latest health status for all checks
 * Uses admin client - caller must verify platform admin authorization
 */
export async function getLatestHealthStatus(): Promise<LatestHealthStatus[]> {
  const db = supabaseAdmin();

  // Get latest check per check_name using raw query via RPC or direct select
  const { data, error } = await db
    .from("ops_health_checks")
    .select("check_type, check_name, status, response_time_ms, error_message, checked_at")
    .order("checked_at", { ascending: false });

  if (error) throw error;

  // Dedupe to get latest per check_name
  const latestByName = new Map<string, LatestHealthStatus>();
  for (const row of data || []) {
    if (!latestByName.has(row.check_name)) {
      latestByName.set(row.check_name, {
        checkType: row.check_type,
        checkName: row.check_name,
        status: row.status,
        responseTimeMs: row.response_time_ms,
        errorMessage: row.error_message,
        checkedAt: row.checked_at,
      });
    }
  }

  return Array.from(latestByName.values());
}

/**
 * Get system overview statistics
 * Uses admin client - caller must verify platform admin authorization
 */
export async function getSystemOverview(): Promise<SystemOverview> {
  const db = supabaseAdmin();

  // Get workspace stats
  const { count: totalWorkspaces } = await db
    .from("workspaces")
    .select("*", { count: "exact", head: true });

  const { count: activeWorkspaces24h } = await db
    .from("workspace_memberships")
    .select("workspace_id", { count: "exact", head: true })
    .gte("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  // Get user stats from profiles (auth.users not directly accessible)
  const { count: totalUsers } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Approximate active users via workspace_memberships updated
  const { count: activeUsers24h } = await db
    .from("workspace_memberships")
    .select("user_id", { count: "exact", head: true })
    .gte("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  // Get ticket stats
  let totalTickets = 0;
  let openTickets = 0;
  try {
    const { count: ticketCount } = await db
      .from("ops_support_tickets")
      .select("*", { count: "exact", head: true });
    totalTickets = ticketCount || 0;

    const { count: openCount } = await db
      .from("ops_support_tickets")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]);
    openTickets = openCount || 0;
  } catch {
    // Table may not exist
  }

  return {
    workspaces: {
      total: totalWorkspaces || 0,
      active_24h: activeWorkspaces24h || 0,
    },
    users: {
      total: totalUsers || 0,
      active_24h: activeUsers24h || 0,
    },
    tickets: {
      total: totalTickets,
      open: openTickets,
    },
    database: {
      size_bytes: 0, // Can't get DB size via client
      size_mb: 0,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get stale workers (no heartbeat in last 10 minutes)
 * Uses admin client - caller must verify platform admin authorization
 */
export async function getStaleWorkers(): Promise<StaleWorker[]> {
  const db = supabaseAdmin();
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("ops_worker_heartbeats")
    .select("worker_name, worker_type, status, heartbeat_at")
    .lt("heartbeat_at", tenMinutesAgo)
    .order("heartbeat_at", { ascending: false });

  if (error) throw error;

  // Dedupe to get latest per worker_name
  const latestByName = new Map<string, StaleWorker>();
  for (const row of data || []) {
    if (!latestByName.has(row.worker_name)) {
      const minutesSince = (Date.now() - new Date(row.heartbeat_at).getTime()) / 60000;
      latestByName.set(row.worker_name, {
        workerName: row.worker_name,
        workerType: row.worker_type,
        status: row.status,
        lastHeartbeat: row.heartbeat_at,
        minutesSinceHeartbeat: Math.round(minutesSince * 10) / 10,
      });
    }
  }

  return Array.from(latestByName.values());
}

/**
 * Record a health check result
 */
export async function recordHealthCheck(params: {
  checkType: HealthCheckType;
  checkName: string;
  status: HealthStatus;
  responseTimeMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin().rpc("ops_record_health_check", {
    p_check_type: params.checkType,
    p_check_name: params.checkName,
    p_status: params.status,
    p_response_time_ms: params.responseTimeMs || null,
    p_error_message: params.errorMessage || null,
    p_metadata: params.metadata || {},
  });

  if (error) throw error;
  return data;
}

/**
 * Update worker heartbeat
 */
export async function updateWorkerHeartbeat(params: {
  workerName: string;
  workerType: string;
  status?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  errorCount?: number;
  lastError?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin().rpc("ops_update_worker_heartbeat", {
    p_worker_name: params.workerName,
    p_worker_type: params.workerType,
    p_status: params.status || "running",
    p_last_run_at: params.lastRunAt || null,
    p_next_run_at: params.nextRunAt || null,
    p_error_count: params.errorCount || 0,
    p_last_error: params.lastError || null,
    p_metadata: params.metadata || {},
  });

  if (error) throw error;
  return data;
}

/**
 * Run database health check
 */
export async function checkDatabaseHealth(): Promise<{
  status: HealthStatus;
  responseTimeMs: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Simple query to check database connection
    const { error } = await supabaseAdmin().from("workspaces").select("id").limit(1);

    const responseTimeMs = Date.now() - startTime;

    if (error) {
      await recordHealthCheck({
        checkType: "database",
        checkName: "postgres_connection",
        status: "unhealthy",
        responseTimeMs,
        errorMessage: error.message,
      });

      return { status: "unhealthy", responseTimeMs, error: error.message };
    }

    const status: HealthStatus = responseTimeMs < 100 ? "healthy" : responseTimeMs < 500 ? "degraded" : "unhealthy";

    await recordHealthCheck({
      checkType: "database",
      checkName: "postgres_connection",
      status,
      responseTimeMs,
    });

    return { status, responseTimeMs };
  } catch (err) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await recordHealthCheck({
      checkType: "database",
      checkName: "postgres_connection",
      status: "unhealthy",
      responseTimeMs,
      errorMessage,
    });

    return { status: "unhealthy", responseTimeMs, error: errorMessage };
  }
}

/**
 * Run all health checks
 */
export async function runAllHealthChecks(): Promise<{
  database: { status: HealthStatus; responseTimeMs: number; error?: string };
  overall: HealthStatus;
}> {
  const database = await checkDatabaseHealth();

  // Determine overall status (can be expanded with more checks)
  const overall = database.status;

  return { database, overall };
}

/**
 * Get health summary for dashboard
 */
export async function getHealthSummary() {
  const [latestChecks, systemOverview, staleWorkers] = await Promise.all([
    getLatestHealthStatus(),
    getSystemOverview(),
    getStaleWorkers(),
  ]);

  // Calculate overall health
  const unhealthyCount = latestChecks.filter((c) => c.status === "unhealthy").length;
  const degradedCount = latestChecks.filter((c) => c.status === "degraded").length;

  let overallStatus: HealthStatus = "healthy";
  if (unhealthyCount > 0) {
    overallStatus = "unhealthy";
  } else if (degradedCount > 0) {
    overallStatus = "degraded";
  }

  return {
    overallStatus,
    checks: latestChecks,
    systemOverview,
    staleWorkers,
    summary: {
      totalChecks: latestChecks.length,
      healthyChecks: latestChecks.filter((c) => c.status === "healthy").length,
      degradedChecks: degradedCount,
      unhealthyChecks: unhealthyCount,
    },
  };
}
