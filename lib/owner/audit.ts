import "server-only";

import { logger } from "@/lib/logging";
import { supabaseAdmin } from "@/lib/supabase/admin";

type OwnerAuditInput = {
  action: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  workspaceId?: string | null;
  targetTable?: string | null;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  meta?: Record<string, unknown> | null;
};

export async function recordOwnerAudit(input: OwnerAuditInput) {
  const db = supabaseAdmin();
  const payload = {
    action: input.action,
    actor_user_id: input.actorUserId ?? null,
    actor_email: input.actorEmail ?? null,
    actor_role: input.actorRole ?? null,
    workspace_id: input.workspaceId ?? null,
    target_table: input.targetTable ?? null,
    target_id: input.targetId ?? null,
    before_data: input.before ?? null,
    after_data: input.after ?? null,
    meta: input.meta ?? null,
  };

  const { error } = await db.from("owner_audit_log").insert(payload);
  if (error && process.env.NODE_ENV !== "production") {
    logger.warn("[owner_audit] insert failed", {
      action: input.action,
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }
}
