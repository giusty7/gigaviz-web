import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type AuditAction =
  | "billing.requested"
  | "feature.interest"
  | "workspace.created"
  | "member.role_updated";

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

  if (error && process.env.NODE_ENV === "development") {
    console.warn("[audit] insert failed", {
      action,
      workspaceId,
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }
}
