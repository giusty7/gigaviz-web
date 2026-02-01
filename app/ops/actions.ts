"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordOwnerAudit } from "@/lib/owner/audit";
import {
  deductWorkspaceTokens,
  grantWorkspaceTokens,
  setWorkspaceEntitlement,
} from "@/lib/owner/ops";
import { assertOpsRateLimit } from "@/lib/ops/rate-limit";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";

type ActionResult = { ok: boolean; error?: string };

const optString = (minLen = 1) =>
  z.preprocess(
    (v) => {
      if (v === null || v === undefined) return undefined;
      const s = String(v).trim();
      return s.length > 0 ? s : undefined;
    },
    z.string().min(minLen).optional()
  );

function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((i) => {
    const path = i.path.length ? `${i.path.join(".")}: ` : "";
    return `${path}${i.message}`;
  });
  if (process.env.NODE_ENV === "development") {
    console.warn("[Ops Action] Zod validation failed:", issues);
  }
  return `Invalid input: ${issues[0] ?? "validation failed"}`;
}

const noteSchema = z.object({
  workspaceId: z.string().uuid(),
  note: z.string().trim().min(3).max(2000),
});

const flagSchema = z.object({
  workspaceId: z.string().uuid(),
  flagKey: z.string().trim().min(2).max(120),
  value: optString(1),
});

const flagToggleSchema = z.object({
  workspaceId: z.string().uuid(),
  flagKey: z.string().trim().min(2).max(120),
  enabled: z.enum(["true", "false"]),
});

const suspendSchema = z.object({
  workspaceId: z.string().uuid(),
  reason: z.string().trim().min(4).max(500),
});

const unsuspendSchema = z.object({
  workspaceId: z.string().uuid(),
  reason: optString(1),
});

const entitlementActionSchema = z.object({
  workspaceId: z.string().uuid(),
  key: z.string().trim().min(2).max(120),
  enabled: z.enum(["true", "false"]),
  payload: optString(1),
  reason: optString(1),
});

const tokenActionSchema = z.object({
  workspaceId: z.string().uuid(),
  amount: z.coerce.number().int().min(1).max(1_000_000),
  reason: z.string().trim().min(3).max(500),
  ref_id: optString(1),
});

function refreshOpsPaths(workspaceId: string) {
  revalidatePath("/ops/platform-admin");
  revalidatePath("/ops/workspaces");
  revalidatePath(`/ops/workspaces/${workspaceId}`);
  revalidatePath("/ops/audit");
  revalidatePath("/ops/god-console");
}

function rateLimitMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith("rate_limited:")) {
    return "Too many ops actions. Please wait and retry.";
  }
  return null;
}

export async function addOwnerNoteAction(formData: FormData): Promise<ActionResult> {
  assertOpsEnabled();
  const parsed = noteSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) return { ok: false, error: "not_authorized" };

  const { workspaceId, note } = parsed.data;
  const { db, user, actorEmail, actorRole } = admin;
  try {
    await assertOpsRateLimit(`${user.id}:note`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  const { data: inserted, error } = await db
    .from("owner_workspace_notes")
    .insert({
      workspace_id: workspaceId,
      note,
      author_email: actorEmail ?? user.email,
    })
    .select("id, created_at")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message || "failed_to_add_note" };
  }

  await recordOwnerAudit({
    action: "owner.note.added",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "owner_workspace_notes",
    targetId: inserted?.id ?? null,
    before: null,
    after: inserted ?? null,
    meta: { note },
  });

  refreshOpsPaths(workspaceId);
  return { ok: true };
}

export async function upsertFeatureFlagAction(formData: FormData): Promise<ActionResult> {
  assertOpsEnabled();
  const parsed = flagSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    flagKey: formData.get("flagKey"),
    value: formData.get("value"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) return { ok: false, error: "not_authorized" };
  const { workspaceId, flagKey, value } = parsed.data;
  const { db, user, actorEmail, actorRole } = admin;

  try {
    await assertOpsRateLimit(`${user.id}:flag`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  const { data: inserted, error } = await db
    .from("owner_feature_flags")
    .upsert(
      {
        workspace_id: workspaceId,
        flag_key: flagKey,
        value: value ?? null,
        updated_email: actorEmail ?? user.email,
      },
      { onConflict: "workspace_id,flag_key" }
    )
    .select("id, updated_at, value, flag_key")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message || "failed_to_save_flag" };
  }

  await recordOwnerAudit({
    action: "owner.flag.upserted",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "owner_feature_flags",
    targetId: inserted?.id ?? null,
    before: null,
    after: inserted ?? null,
    meta: { flagKey, value },
  });

  refreshOpsPaths(workspaceId);
  return { ok: true };
}

export async function toggleFeatureFlagAction(formData: FormData): Promise<ActionResult> {
  assertOpsEnabled();
  const parsed = flagToggleSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    flagKey: formData.get("flagKey"),
    enabled: formData.get("enabled"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) return { ok: false, error: "not_authorized" };
  const { workspaceId, flagKey, enabled } = parsed.data;
  const { db, user, actorEmail, actorRole } = admin;

  try {
    await assertOpsRateLimit(`${user.id}:flag_toggle`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  const enableVal = enabled === "true";
  const { data: updated, error } = await db
    .from("owner_feature_flags")
    .update({
      enabled: enableVal,
      updated_email: actorEmail ?? user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("flag_key", flagKey)
    .select("id, enabled, updated_at")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message || "failed_to_toggle_flag" };
  }

  await recordOwnerAudit({
    action: enableVal ? "owner.flag.enabled" : "owner.flag.disabled",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "owner_feature_flags",
    targetId: updated?.id ?? null,
    before: null,
    after: updated ?? null,
    meta: { flagKey },
  });

  refreshOpsPaths(workspaceId);
  return { ok: true };
}

export async function suspendWorkspaceAction(formData: FormData): Promise<ActionResult> {
  assertOpsEnabled();
  const parsed = suspendSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) return { ok: false, error: "not_authorized" };
  const { workspaceId, reason } = parsed.data;
  const { db, user, actorEmail, actorRole } = admin;

  try {
    await assertOpsRateLimit(`${user.id}:suspend`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  const { data: updated, error } = await db
    .from("workspaces")
    .update({
      status: "suspended",
      suspended_reason: reason,
      suspended_at: new Date().toISOString(),
    })
    .eq("id", workspaceId)
    .select("id, status, suspended_reason, suspended_at")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message || "failed_to_suspend" };
  }

  await recordOwnerAudit({
    action: "owner.workspace.suspended",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "workspaces",
    targetId: updated?.id ?? null,
    before: null,
    after: updated ?? null,
    meta: { reason },
  });

  refreshOpsPaths(workspaceId);
  return { ok: true };
}

export async function unsuspendWorkspaceAction(formData: FormData): Promise<ActionResult> {
  assertOpsEnabled();
  const parsed = unsuspendSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) return { ok: false, error: "not_authorized" };
  const { workspaceId, reason } = parsed.data;
  const { db, user, actorEmail, actorRole } = admin;

  try {
    await assertOpsRateLimit(`${user.id}:unsuspend`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  const { data: updated, error } = await db
    .from("workspaces")
    .update({
      status: "active",
      suspended_reason: reason ?? null,
      suspended_at: null,
    })
    .eq("id", workspaceId)
    .select("id, status, suspended_reason, suspended_at")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message || "failed_to_unsuspend" };
  }

  await recordOwnerAudit({
    action: "owner.workspace.unsuspended",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "workspaces",
    targetId: updated?.id ?? null,
    before: null,
    after: updated ?? null,
    meta: { reason },
  });

  refreshOpsPaths(workspaceId);
  return { ok: true };
}

export async function setEntitlementAction(formData: FormData): Promise<ActionResult> {
  assertOpsEnabled();
  const parsed = entitlementActionSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    key: formData.get("key"),
    enabled: formData.get("enabled"),
    payload: formData.get("payload"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) return { ok: false, error: "not_authorized" };
  const { workspaceId, key, enabled, payload, reason } = parsed.data;

  const result = await setWorkspaceEntitlement({
    workspaceId,
    key,
    enabled: enabled === "true",
    payload: payload ? JSON.parse(payload) : {},
    reason: reason ?? undefined,
  });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "failed_to_set_entitlement" };
  }

  refreshOpsPaths(workspaceId);
  return { ok: true };
}

export async function grantTokensAction(formData: FormData): Promise<ActionResult> {
  assertOpsEnabled();
  const parsed = tokenActionSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    ref_id: formData.get("ref_id"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) return { ok: false, error: "not_authorized" };
  const { workspaceId, amount, reason, ref_id } = parsed.data;

  const result = await grantWorkspaceTokens({
    workspaceId,
    amount,
    reason,
    ref_id: ref_id ?? undefined,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  refreshOpsPaths(workspaceId);
  return { ok: true };
}

export async function deductTokensAction(formData: FormData): Promise<ActionResult> {
  assertOpsEnabled();
  const parsed = tokenActionSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    ref_id: formData.get("ref_id"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) return { ok: false, error: "not_authorized" };
  const { workspaceId, amount, reason, ref_id } = parsed.data;

  const result = await deductWorkspaceTokens({
    workspaceId,
    amount,
    reason,
    ref_id: ref_id ?? undefined,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  refreshOpsPaths(workspaceId);
  return { ok: true };
}

// Unified aliases
export const SovereignGrantAction = grantTokensAction;
export const SovereignEntitlementAction = setEntitlementAction;

// Legacy aliases for components still importing the old names
export const setWorkspaceEntitlementAction = setEntitlementAction;
export const grantWorkspaceTokensAction = grantTokensAction;
export const deductWorkspaceTokensAction = deductTokensAction;
