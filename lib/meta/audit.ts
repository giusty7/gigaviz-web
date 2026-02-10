import { logger } from "@/lib/logging";

type AuditParams = {
  db: unknown;
  workspaceId: string;
  userId?: string | null;
  action: string;
  ok: boolean;
  detail?: Record<string, unknown> | null;
  error?: string | null;
};

type DbQuery = {
  insert: (values: Record<string, unknown>) => DbQuery;
  select: (columns: string) => DbQuery;
  maybeSingle: () => Promise<{ error?: { message: string } | null }>;
};

type DbClient = { from: (table: string) => DbQuery };

export async function logMetaAdminAudit(params: AuditParams) {
  const client = params.db as DbClient;
  const { error } = await client
    .from("meta_admin_audit")
    .insert({
      workspace_id: params.workspaceId,
      action: params.action,
      ok: params.ok,
      detail: params.detail ?? null,
      error: params.error ?? null,
      created_by: params.userId ?? "system",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    logger.info("meta_admin_audit insert failed", error.message);
  }
}
