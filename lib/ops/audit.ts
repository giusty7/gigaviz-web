import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Log impersonation start to audit trail
 */
export async function logImpersonationStart({
  actorUserId,
  targetUserId,
  workspaceId,
  impersonationId,
  reason,
  durationMinutes,
}: {
  actorUserId: string;
  targetUserId: string;
  workspaceId: string;
  impersonationId: string;
  reason: string;
  durationMinutes: number;
}) {
  const db = supabaseAdmin();

  await db.from("ops_audit_log").insert({
    action: "impersonation_started",
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    workspace_id: workspaceId,
    metadata: {
      impersonation_id: impersonationId,
      reason,
      duration_minutes: durationMinutes,
    },
  });
}

/**
 * Log impersonation end to audit trail
 */
export async function logImpersonationEnd({
  actorUserId,
  targetUserId,
  workspaceId,
  impersonationId,
}: {
  actorUserId: string;
  targetUserId: string;
  workspaceId: string;
  impersonationId: string;
}) {
  const db = supabaseAdmin();

  await db.from("ops_audit_log").insert({
    action: "impersonation_ended",
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    workspace_id: workspaceId,
    metadata: {
      impersonation_id: impersonationId,
    },
  });
}
