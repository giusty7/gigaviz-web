import "server-only";
import { logger } from "@/lib/logging";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type CustomerSearchResult = {
  matchType: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  workspaceStatus: string;
  workspacePlan: string;
  workspaceCreatedAt: string;
  userId: string | null;
  userEmail: string | null;
  userPhone: string | null;
  ownerEmail: string | null;
  entitlements: Record<string, boolean> | null;
  tokenBalance: number | null;
  relevanceScore: number;
};

export type SearchHistoryEntry = {
  id: string;
  actorUserId: string;
  actorEmail: string | null;
  query: string;
  queryType: string | null;
  resultCount: number;
  resultsPreview: unknown;
  createdAt: string;
};

/**
 * Search for customers by email, phone, workspace slug/id, or user id
 */
export async function searchCustomers(
  query: string,
  limit = 50
): Promise<CustomerSearchResult[]> {
  const supabase = await supabaseServer();

  // Get current user for audit
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  const userEmail = userData?.user?.email;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Debug: Check auth context
  const { data: authCheck } = await supabase.rpc('auth.uid' as string).single();
  logger.info('[DEBUG] Customer search auth context:', {
    userId,
    userEmail,
    authUid: authCheck,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
  });

  // Call RPC function using USER SESSION (not service role)
  // This ensures auth.uid() returns the logged-in user's ID
  const { data, error } = await supabase.rpc("ops_search_customers", {
    p_query: query,
    p_limit: limit,
  });

  if (error) {
    logger.error("Customer search error:", error);
    throw new Error(`Search failed: ${error.message}`);
  }

  const results = (data ?? []) as Array<{
    match_type: string;
    workspace_id: string;
    workspace_slug: string;
    workspace_name: string;
    workspace_status: string;
    workspace_plan: string;
    workspace_created_at: string;
    user_id: string | null;
    user_email: string | null;
    user_phone: string | null;
    owner_email: string | null;
    entitlements: Record<string, boolean> | null;
    token_balance: number | null;
    relevance_score: number;
  }>;

  // Log search
  await logSearch(userId, userEmail ?? null, query, results);

  // Transform to camelCase
  return results.map((r) => ({
    matchType: r.match_type,
    workspaceId: r.workspace_id,
    workspaceSlug: r.workspace_slug,
    workspaceName: r.workspace_name,
    workspaceStatus: r.workspace_status,
    workspacePlan: r.workspace_plan,
    workspaceCreatedAt: r.workspace_created_at,
    userId: r.user_id,
    userEmail: r.user_email,
    userPhone: r.user_phone,
    ownerEmail: r.owner_email,
    entitlements: r.entitlements,
    tokenBalance: r.token_balance,
    relevanceScore: r.relevance_score,
  }));
}

/**
 * Log customer search to ops_customer_searches table
 */
async function logSearch(
  userId: string,
  userEmail: string | null,
  query: string,
  results: unknown[]
): Promise<void> {
  const db = supabaseAdmin();

  // Determine query type
  const queryType = detectQueryType(query);

  // Store first 3 results as preview
  const resultsPreview = results.slice(0, 3);

  await db.from("ops_customer_searches").insert({
    actor_user_id: userId,
    actor_email: userEmail ?? null,
    query: query.trim(),
    query_type: queryType,
    result_count: results.length,
    results_preview: resultsPreview,
  });
}

/**
 * Detect query type from pattern
 */
function detectQueryType(query: string): string {
  const normalized = query.trim().toLowerCase();

  // UUID pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) {
    return "uuid";
  }

  // Email pattern
  if (/@/.test(normalized)) {
    return "email";
  }

  // Phone pattern (basic)
  if (/^\+?[0-9\s\-()]+$/.test(normalized) && normalized.replace(/\D/g, "").length >= 10) {
    return "phone";
  }

  // Workspace slug pattern (alphanumeric with dashes)
  if (/^[a-z0-9\-]+$/.test(normalized)) {
    return "workspace_slug";
  }

  return "text";
}

/**
 * Get recent search history for current user
 */
export async function getSearchHistory(limit = 20): Promise<SearchHistoryEntry[]> {
  const db = supabaseAdmin();
  const supabase = await supabaseServer();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await db
    .from("ops_customer_searches")
    .select("*")
    .eq("actor_user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Failed to fetch search history:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    query: row.query,
    queryType: row.query_type,
    resultCount: row.result_count,
    resultsPreview: row.results_preview,
    createdAt: row.created_at,
  }));
}
