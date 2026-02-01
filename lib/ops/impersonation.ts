import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ImpersonationSession = {
  id: string;
  actorEmail: string;
  targetEmail: string;
  workspaceSlug: string;
  reason: string;
  expiresAt: string;
  createdAt: string;
};

/**
 * Get active impersonation for target user (called by app middleware)
 */
export async function getActiveImpersonation(
  targetUserId: string
): Promise<ImpersonationSession | null> {
  const db = supabaseAdmin();

  const { data, error } = await db.rpc("ops_get_active_impersonation", {
    p_target_user_id: targetUserId,
  });

  if (error) {
    console.error("[ops] Get active impersonation error:", error);
    return null;
  }

  const result = data?.[0];
  if (!result) return null;

  return {
    id: result.id,
    actorEmail: result.actor_email,
    targetEmail: result.target_email,
    workspaceSlug: result.workspace_slug,
    reason: result.reason,
    expiresAt: result.expires_at,
    createdAt: result.created_at,
  };
}

/**
 * Get impersonation history (platform admin view)
 */
export async function getImpersonationHistory(options: {
  targetUserId?: string;
  actorUserId?: string;
  workspaceId?: string;
  limit?: number;
}) {
  const db = supabaseAdmin();
  let query = db
    .from("ops_impersonations")
    .select(
      "id, actor_email, target_email, workspace_slug, reason, expires_at, ended_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(options.limit || 50);

  if (options.targetUserId) {
    query = query.eq("target_user_id", options.targetUserId);
  }
  if (options.actorUserId) {
    query = query.eq("actor_user_id", options.actorUserId);
  }
  if (options.workspaceId) {
    query = query.eq("workspace_id", options.workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[ops] Get impersonation history error:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    actorEmail: row.actor_email,
    targetEmail: row.target_email,
    workspaceSlug: row.workspace_slug,
    reason: row.reason,
    expiresAt: row.expires_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  }));
}
