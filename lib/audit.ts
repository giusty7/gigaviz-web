import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

export type AuditAction =
  | "billing.requested"
  | "feature.interest"
  | "workspace.created"
  | "workspace.updated"
  | "workspace.deleted"
  | "member.role_updated"
  | "member.invited"
  | "member.removed"
  | "tokens.topup_requested"
  | "tokens.topup_paid"
  | "tokens.consumed"
  | "contact.created"
  | "contact.imported"
  | "contact.exported"
  | "contact.deleted"
  | "template.created"
  | "template.synced"
  | "template.deleted"
  | "message.sent"
  | "message.received"
  | "automation.created"
  | "automation.updated"
  | "automation.deleted"
  | "auth.login"
  | "auth.logout"
  | "settings.updated";

export type AuditEventInput = {
  workspaceId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: AuditAction | string;
  meta?: Record<string, unknown> | null;
};

export async function recordAuditEvent(input: AuditEventInput) {
  const { workspaceId, actorUserId, actorEmail, action, meta } = input;
  const db = supabaseAdmin();
  const { error } = await db.from("audit_events").insert({
    workspace_id: workspaceId,
    actor_user_id: actorUserId ?? null,
    actor_email: actorEmail ?? null,
    action,
    meta: meta ?? null,
  });

  if (error) {
    // Always log audit failures — they indicate data integrity issues
    logger.error("[audit] insert failed", {
      action,
      workspaceId,
      code: error.code,
      message: error.message,
    });
  }
}
