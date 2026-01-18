"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordOwnerAudit } from "@/lib/owner/audit";
import {
  deductWorkspaceTokens,
  grantWorkspaceTokens,
  setWorkspaceEntitlement,
} from "@/lib/owner/ops";
import { requireOwner } from "@/lib/owner/requireOwner";
import { assertOwnerRateLimit } from "@/lib/owner/rate-limit";

type ActionResult = { ok: boolean; error?: string };

/**
 * Helper for optional string fields that safely handles null/undefined from FormData.
 * Converts null/undefined/empty-whitespace to undefined, otherwise trims the string.
 */
const optString = (minLen = 1) =>
  z.preprocess(
    (v) => {
      if (v === null || v === undefined) return undefined;
      const s = String(v).trim();
      return s.length > 0 ? s : undefined;
    },
    z.string().min(minLen).optional()
  );

/** Format Zod errors for user-friendly display */
function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((i) => {
    const path = i.path.length ? `${i.path.join(".")}: ` : "";
    return `${path}${i.message}`;
  });
  if (process.env.NODE_ENV === "development") {
    console.warn("[Owner Action] Zod validation failed:", issues);
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

function refreshOwnerPaths(workspaceId: string) {
  revalidatePath("/owner");
  revalidatePath("/owner/workspaces");
  revalidatePath(`/owner/workspaces/${workspaceId}`);
  revalidatePath("/owner/audit");
}

function rateLimitMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith("rate_limited:")) {
    return "Too many owner actions. Please wait and retry.";
  }
  return null;
}

export async function addOwnerNoteAction(formData: FormData): Promise<ActionResult> {
  const parsed = noteSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const owner = await requireOwner();
  if (!owner.ok) return { ok: false, error: "not_authorized" };

  const { workspaceId, note } = parsed.data;
  const { db, user, actorEmail, actorRole } = owner;
  try {
    assertOwnerRateLimit(`${user.id}:note`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  const { data: inserted, error } = await db
    .from("owner_workspace_notes")
    .insert({
      workspace_id: workspaceId,
      note,
      author_user_id: user.id,
      author_email: actorEmail,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "failed_to_save_note" };
  }

  await recordOwnerAudit({
    action: "owner.note.added",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "owner_workspace_notes",
    targetId: inserted.id,
    after: inserted,
  });

  refreshOwnerPaths(workspaceId);
  return { ok: true };
}

export async function upsertFeatureFlagAction(formData: FormData): Promise<ActionResult> {
  const parsed = flagSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    flagKey: formData.get("flagKey"),
    value: formData.get("value"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const owner = await requireOwner();
  if (!owner.ok) return { ok: false, error: "not_authorized" };

  const { workspaceId, flagKey, value } = parsed.data;
  const { db, user, actorEmail, actorRole } = owner;
  try {
    assertOwnerRateLimit(`${user.id}:flag`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  let parsedValue: unknown = null;
  const trimmed = value?.trim() ?? "";
  if (trimmed) {
    try {
      parsedValue = JSON.parse(trimmed);
    } catch {
      return { ok: false, error: "Invalid JSON value" };
    }
  }

  const { data: existing } = await db
    .from("owner_feature_flags")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("flag_key", flagKey)
    .maybeSingle();

  const { data: updated, error } = await db
    .from("owner_feature_flags")
    .upsert(
      {
        workspace_id: workspaceId,
        flag_key: flagKey,
        value: parsedValue,
        enabled: existing?.enabled ?? true,
        updated_by: user.id,
        updated_email: actorEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,flag_key" }
    )
    .select("*")
    .single();

  if (error || !updated) {
    return { ok: false, error: "failed_to_save_flag" };
  }

  await recordOwnerAudit({
    action: existing ? "owner.flag.updated" : "owner.flag.created",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "owner_feature_flags",
    targetId: updated.id,
    before: existing,
    after: updated,
  });

  refreshOwnerPaths(workspaceId);
  return { ok: true };
}

export async function toggleFeatureFlagAction(formData: FormData): Promise<ActionResult> {
  const parsed = flagToggleSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    flagKey: formData.get("flagKey"),
    enabled: formData.get("enabled"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const owner = await requireOwner();
  if (!owner.ok) return { ok: false, error: "not_authorized" };

  const { workspaceId, flagKey, enabled } = parsed.data;
  const { db, user, actorEmail, actorRole } = owner;
  try {
    assertOwnerRateLimit(`${user.id}:flag_toggle`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }
  const enabledBool = enabled === "true";

  const { data: existing } = await db
    .from("owner_feature_flags")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("flag_key", flagKey)
    .maybeSingle();

  const { data: updated, error } = await db
    .from("owner_feature_flags")
    .upsert(
      {
        workspace_id: workspaceId,
        flag_key: flagKey,
        enabled: enabledBool,
        value: existing?.value ?? null,
        updated_by: user.id,
        updated_email: actorEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,flag_key" }
    )
    .select("*")
    .single();

  if (error || !updated) {
    return { ok: false, error: "failed_to_toggle_flag" };
  }

  await recordOwnerAudit({
    action: enabledBool ? "owner.flag.enabled" : "owner.flag.disabled",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "owner_feature_flags",
    targetId: updated.id,
    before: existing,
    after: updated,
  });

  refreshOwnerPaths(workspaceId);
  return { ok: true };
}

export async function suspendWorkspaceAction(formData: FormData): Promise<ActionResult> {
  const parsed = suspendSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const owner = await requireOwner();
  if (!owner.ok) return { ok: false, error: "not_authorized" };

  const { workspaceId, reason } = parsed.data;
  const { db, user, actorEmail, actorRole } = owner;
  try {
    assertOwnerRateLimit(`${user.id}:suspend`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  const { data: before, error: fetchError } = await db
    .from("workspaces")
    .select("id, name, slug, status, suspended_reason, suspended_at, suspended_by, created_at")
    .eq("id", workspaceId)
    .maybeSingle();

  if (fetchError || !before) {
    return { ok: false, error: "workspace_not_found" };
  }

  const update = {
    status: "suspended",
    suspended_reason: reason,
    suspended_at: new Date().toISOString(),
    suspended_by: user.id,
  };

  const { data: after, error } = await db
    .from("workspaces")
    .update(update)
    .eq("id", workspaceId)
    .select("id, name, slug, status, suspended_reason, suspended_at, suspended_by, created_at")
    .single();

  if (error || !after) {
    return { ok: false, error: "failed_to_suspend" };
  }

  await recordOwnerAudit({
    action: "owner.workspace.suspended",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "workspaces",
    targetId: workspaceId,
    before,
    after,
    meta: { reason },
  });

  refreshOwnerPaths(workspaceId);
  return { ok: true };
}

export async function unsuspendWorkspaceAction(formData: FormData): Promise<ActionResult> {
  const parsed = unsuspendSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const owner = await requireOwner();
  if (!owner.ok) return { ok: false, error: "not_authorized" };

  const { workspaceId, reason } = parsed.data;
  const { db, user, actorEmail, actorRole } = owner;
  try {
    assertOwnerRateLimit(`${user.id}:unsuspend`);
  } catch (error) {
    return { ok: false, error: rateLimitMessage(error) ?? "rate_limited" };
  }

  const { data: before, error: fetchError } = await db
    .from("workspaces")
    .select("id, name, slug, status, suspended_reason, suspended_at, suspended_by, created_at")
    .eq("id", workspaceId)
    .maybeSingle();

  if (fetchError || !before) {
    return { ok: false, error: "workspace_not_found" };
  }

  const update = {
    status: "active",
    suspended_reason: reason?.trim() || null,
    suspended_at: null,
    suspended_by: null,
  };

  const { data: after, error } = await db
    .from("workspaces")
    .update(update)
    .eq("id", workspaceId)
    .select("id, name, slug, status, suspended_reason, suspended_at, suspended_by, created_at")
    .single();

  if (error || !after) {
    return { ok: false, error: "failed_to_unsuspend" };
  }

  await recordOwnerAudit({
    action: "owner.workspace.unsuspended",
    actorUserId: user.id,
    actorEmail,
    actorRole,
    workspaceId,
    targetTable: "workspaces",
    targetId: workspaceId,
    before,
    after,
    meta: { reason: reason ?? null },
  });

  refreshOwnerPaths(workspaceId);
  return { ok: true };
}

export async function setWorkspaceEntitlementAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
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

  let payload: unknown = {};
  const rawPayload = parsed.data.payload?.trim();
  if (rawPayload) {
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      return { ok: false, error: "Invalid JSON payload" };
    }
  }

  const result = await setWorkspaceEntitlement({
    workspaceId: parsed.data.workspaceId,
    key: parsed.data.key,
    enabled: parsed.data.enabled === "true",
    payload,
    reason: parsed.data.reason,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  refreshOwnerPaths(parsed.data.workspaceId);
  return { ok: true };
}

export async function grantWorkspaceTokensAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = tokenActionSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    ref_id: formData.get("ref_id"),
  });

  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const result = await grantWorkspaceTokens(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  refreshOwnerPaths(parsed.data.workspaceId);
  return { ok: true };
}

export async function deductWorkspaceTokensAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = tokenActionSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    ref_id: formData.get("ref_id"),
  });

  if (!parsed.success) {
    return { ok: false, error: formatZodError(parsed.error) };
  }

  const result = await deductWorkspaceTokens(parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  refreshOwnerPaths(parsed.data.workspaceId);
  return { ok: true };
}
