import "server-only";

import { z } from "zod";
import { validatePayload } from "@/lib/entitlements/payload-spec";
import { recordOwnerAudit } from "@/lib/owner/audit";
import { requireOwner } from "@/lib/owner/requireOwner";
import { assertOpsRateLimit } from "@/lib/ops/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";

type OwnerOpResult<T> = { ok: true; data: T } | { ok: false; error: string };

const entitlementSchema = z.object({
  workspaceId: z.string().uuid(),
  key: z.string().trim().min(2).max(120),
  enabled: z.boolean(),
  payload: z.unknown().optional(),
  reason: z.string().trim().max(500).optional(),
});

const tokenSchema = z.object({
  workspaceId: z.string().uuid(),
  amount: z.number().int().min(1).max(1_000_000),
  reason: z.string().trim().min(3).max(500),
  ref_id: z.string().trim().max(200).optional(),
});

const workspaceIdSchema = z.string().uuid();

export type WorkspaceEntitlementRow = {
  workspace_id: string;
  key: string;
  enabled: boolean;
  payload: unknown;
  expires_at?: string | null;
  reason?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  granted_by?: string | null;
};

export async function setWorkspaceEntitlement(
  input: unknown
): Promise<OwnerOpResult<WorkspaceEntitlementRow>> {
  const parsed = entitlementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const owner = await requireOwner();
  if (!owner.ok) return { ok: false, error: owner.reason };

  try {
    await assertOpsRateLimit(`${owner.user.id}:entitlement`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("rate_limited:")) {
      return { ok: false, error: "Too many owner actions. Please wait and retry." };
    }
    return { ok: false, error: "rate_limited" };
  }

  const { workspaceId, key, enabled, payload, reason } = parsed.data;
  let validatedPayload: unknown = {};
  try {
    validatedPayload = validatePayload(key, payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: error.issues[0]?.message ?? "Invalid entitlement payload",
      };
    }
    return { ok: false, error: "Invalid entitlement payload" };
  }
  const { db, user, actorEmail, actorRole } = owner;

  // Wrap payload with consistent metadata structure
  const enrichedPayload = {
    version: 1,
    ...((typeof validatedPayload === "object" && validatedPayload) || {}),
    meta: {
      source: "sovereign_command",
      granted_by: user.id,
      granted_by_email: actorEmail,
      granted_at: new Date().toISOString(),
      reason: reason ?? null,
    },
  };

  const { data: before } = await db
    .from("workspace_entitlements")
    .select("workspace_id, key, enabled, payload, updated_at, updated_by")
    .eq("workspace_id", workspaceId)
    .eq("key", key)
    .maybeSingle();

  const supabase = await supabaseServer();
  const { data: rpcData, error } = await supabase.rpc("set_workspace_entitlement_payload", {
    p_workspace_id: workspaceId,
    p_entitlement_key: key,
    p_enabled: enabled,
    p_payload: enrichedPayload,
    p_expires_at: null,
    p_reason: reason ?? null,
  });

  const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  const after: WorkspaceEntitlementRow | null = result
    ? {
        workspace_id: result.workspace_id,
        key: result.entitlement_key,
        enabled: result.enabled,
        payload: result.payload,
        expires_at: result.expires_at ?? null,
        reason: result.reason ?? null,
        updated_at: result.updated_at ?? null,
        updated_by: result.granted_by ?? null,
        granted_by: result.granted_by ?? null,
      }
    : null;

  if (error || !after) {
    // Log structured error for debugging
    console.error("[Owner Ops] setWorkspaceEntitlement failed:", {
      action: "setWorkspaceEntitlement",
      workspace_id: workspaceId,
      key,
      enabled,
      payload: JSON.stringify(validatedPayload),
      error: error
        ? {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        : "no data returned",
    });
    const errorMessage = error?.message
      ? `failed_to_set_entitlement: ${error.message}`
      : "failed_to_set_entitlement: no data returned";
    return { ok: false, error: errorMessage };
  }

  await recordOwnerAudit({
    action: enabled ? "entitlement.grant" : "entitlement.revoke",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "workspace_entitlements",
    targetId: `${workspaceId}:${key}`,
    before: before ?? null,
    after,
    meta: { key, reason: reason ?? null, source: "sovereign_command" },
  });

  return { ok: true, data: after };
}

async function applyTokenDelta(
  input: unknown,
  deltaSign: 1 | -1,
  refType: string
): Promise<OwnerOpResult<{ applied: boolean; balance: number | null }>> {
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const owner = await requireOwner();
  if (!owner.ok) return { ok: false, error: owner.reason };

  try {
    await assertOpsRateLimit(`${owner.user.id}:tokens`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("rate_limited:")) {
      return { ok: false, error: "Too many owner actions. Please wait and retry." };
    }
    return { ok: false, error: "rate_limited" };
  }

  const { workspaceId, amount, reason, ref_id } = parsed.data;
  const { db, user, actorEmail, actorRole } = owner;

  const beforeBalance = await getWorkspaceTokenBalance(workspaceId);
  const delta = deltaSign * amount;

  const { data, error } = await db.rpc("apply_workspace_token_delta", {
    p_workspace_id: workspaceId,
    p_delta: delta,
    p_reason: reason,
    p_ref_type: refType,
    p_ref_id: ref_id ?? null,
    p_actor: user.id,
  });

  if (error) {
    return { ok: false, error: error.message || "failed_to_apply_tokens" };
  }

  const result = Array.isArray(data) ? data[0] : data;
  const applied = Boolean(result?.applied ?? true);
  const afterBalance =
    typeof result?.balance === "number"
      ? result.balance
      : await getWorkspaceTokenBalance(workspaceId);

  await recordOwnerAudit({
    action: deltaSign > 0 ? "owner.tokens.granted" : "owner.tokens.deducted",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "workspace_token_ledger",
    targetId: result?.ledger_id ?? null,
    before: { balance: beforeBalance },
    after: { balance: afterBalance, delta, applied },
    meta: { reason, ref_id: ref_id ?? null, ref_type: refType },
  });

  return { ok: true, data: { applied, balance: afterBalance ?? null } };
}

export async function grantWorkspaceTokens(input: unknown) {
  return applyTokenDelta(input, 1, "owner_grant");
}

export async function deductWorkspaceTokens(input: unknown) {
  return applyTokenDelta(input, -1, "owner_deduct");
}

export async function getWorkspaceTokenBalance(
  workspaceId: string
): Promise<number | null> {
  const parsed = workspaceIdSchema.safeParse(workspaceId);
  if (!parsed.success) return null;

  const owner = await requireOwner();
  if (!owner.ok) return null;

  const db = owner.db;
  const { data, error } = await db
    .from("workspace_token_balance")
    .select("balance")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!error && data?.balance !== undefined && data?.balance !== null) {
    return Number(data.balance);
  }

  const { data: ledger, error: ledgerErr } = await db
    .from("workspace_token_ledger")
    .select("delta")
    .eq("workspace_id", workspaceId);

  if (ledgerErr) return null;
  return (ledger ?? []).reduce((sum, row) => sum + Number(row.delta ?? 0), 0);
}

export async function getEntitlements(
  workspaceId: string
): Promise<OwnerOpResult<WorkspaceEntitlementRow[]>> {
  const parsed = workspaceIdSchema.safeParse(workspaceId);
  if (!parsed.success) {
    return { ok: false, error: "invalid_workspace" };
  }

  const owner = await requireOwner();
  if (!owner.ok) return { ok: false, error: owner.reason };

  const db = owner.db;
  const { data, error } = await db
    .from("workspace_entitlements")
    .select("workspace_id, key, enabled, payload, updated_at, updated_by")
    .eq("workspace_id", workspaceId)
    .order("key", { ascending: true });

  if (error) {
    return { ok: false, error: "failed_to_fetch_entitlements" };
  }

  return { ok: true, data: (data ?? []) as WorkspaceEntitlementRow[] };
}
