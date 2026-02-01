import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_TABLES = [
  "workspaces",
  "workspace_memberships",
  "profiles",
  "subscriptions",
  "token_wallets",
  "workspace_entitlements",
  "wa_threads",
  "wa_messages",
  "wa_contacts",
  "ops_support_tickets",
  "ops_webhook_logs",
  "ops_feature_flags",
];

const BLOCKED_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "drop",
  "truncate",
  "alter",
  "create",
  "grant",
  "revoke",
];

/**
 * Validate SQL query (read-only, allowed tables)
 */
export function validateSqlQuery(query: string): { valid: boolean; error?: string } {
  const normalized = query.toLowerCase().trim();

  // Must be a SELECT
  if (!normalized.startsWith("select")) {
    return { valid: false, error: "Only SELECT queries are allowed" };
  }

  // Check for blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return { valid: false, error: `Keyword '${keyword}' is not allowed` };
    }
  }

  // Check if referencing allowed tables (basic check)
  const hasAllowedTable = ALLOWED_TABLES.some((table) =>
    normalized.includes(`from ${table}`) || normalized.includes(`join ${table}`)
  );

  if (!hasAllowedTable) {
    return {
      valid: false,
      error: `Query must reference one of: ${ALLOWED_TABLES.join(", ")}`,
    };
  }

  // Limit result set
  if (!normalized.includes("limit")) {
    return { valid: false, error: "Query must include LIMIT clause (max 100)" };
  }

  return { valid: true };
}

/**
 * Execute read-only SQL query
 */
export async function executeSqlQuery(params: {
  query: string;
  adminId: string;
  adminEmail: string;
}): Promise<{
  rows: unknown[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}> {
  const startTime = Date.now();

  // Validate query
  const validation = validateSqlQuery(params.query);
  if (!validation.valid) {
    // Log failed attempt
    await supabaseAdmin().from("ops_sql_query_logs").insert({
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      query_text: params.query,
      execution_time_ms: 0,
      row_count: 0,
      error_message: validation.error,
    });

    return {
      rows: [],
      rowCount: 0,
      executionTimeMs: 0,
      error: validation.error,
    };
  }

  // Execute query
  try {
    const { data, error } = await supabaseAdmin().rpc("exec_sql", {
      sql: params.query,
    });

    const executionTimeMs = Date.now() - startTime;

    if (error) {
      // Log error
      await supabaseAdmin().from("ops_sql_query_logs").insert({
        admin_id: params.adminId,
        admin_email: params.adminEmail,
        query_text: params.query,
        execution_time_ms: executionTimeMs,
        row_count: 0,
        error_message: error.message,
      });

      return {
        rows: [],
        rowCount: 0,
        executionTimeMs,
        error: error.message,
      };
    }

    const rows = Array.isArray(data) ? data : [];

    // Log successful execution
    await supabaseAdmin().from("ops_sql_query_logs").insert({
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      query_text: params.query,
      execution_time_ms: executionTimeMs,
      row_count: rows.length,
      error_message: null,
    });

    return {
      rows,
      rowCount: rows.length,
      executionTimeMs,
    };
  } catch (err) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // Log error
    await supabaseAdmin().from("ops_sql_query_logs").insert({
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      query_text: params.query,
      execution_time_ms: executionTimeMs,
      row_count: 0,
      error_message: errorMessage,
    });

    return {
      rows: [],
      rowCount: 0,
      executionTimeMs,
      error: errorMessage,
    };
  }
}

/**
 * Get SQL query history
 */
export async function getSqlQueryHistory(adminId?: string, limit = 50): Promise<
  Array<{
    id: string;
    adminEmail: string;
    queryText: string;
    executionTimeMs: number;
    rowCount: number;
    errorMessage: string | null;
    createdAt: string;
  }>
> {
  let query = supabaseAdmin()
    .from("ops_sql_query_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (adminId) {
    query = query.eq("admin_id", adminId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    adminEmail: row.admin_email,
    queryText: row.query_text,
    executionTimeMs: row.execution_time_ms,
    rowCount: row.row_count,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));
}
