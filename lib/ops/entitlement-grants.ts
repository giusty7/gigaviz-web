import "server-only";

import { logger } from "@/lib/logging";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recordOwnerAudit } from "@/lib/owner/audit";
import { ENTITLEMENT_KEYS, type EntitlementKey } from "@/lib/entitlements/payload-spec";

export type EntitlementGrant = {
  id: string;
  workspace_id: string;
  key: string;
  enabled: boolean;
  granted_by: string | null;
  granted_at: string | null;
  reason: string | null;
  expires_at: string | null;
};

export type GrantEntitlementParams = {
  workspaceId: string;
  entitlementKey: string;
  grantedBy: string;
  grantedByEmail: string;
  reason?: string;
  expiresAt?: string;
};

export type RevokeEntitlementParams = {
  workspaceId: string;
  entitlementKey: string;
  revokedBy: string;
  revokedByEmail: string;
  reason?: string;
};

export type WorkspaceWithEntitlements = {
  id: string;
  name: string;
  slug: string;
  created_at: string | null;
  owner_email: string | null;
  plan_code: string | null;
  subscription_status: string | null;
  entitlements: {
    key: string;
    enabled: boolean;
    source: "plan" | "grant";
    granted_by?: string | null;
    granted_at?: string | null;
    reason?: string | null;
    expires_at?: string | null;
  }[];
};

/**
 * Get all available entitlement keys
 */
export function getAllEntitlementKeys(): EntitlementKey[] {
  return [...ENTITLEMENT_KEYS];
}

/**
 * Grant an entitlement to a workspace
 */
export async function grantEntitlement(params: GrantEntitlementParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const { workspaceId, entitlementKey, grantedBy, grantedByEmail, reason, expiresAt } = params;

  // Validate entitlement key
  if (!ENTITLEMENT_KEYS.includes(entitlementKey as EntitlementKey)) {
    return { success: false, error: `Invalid entitlement key: ${entitlementKey}` };
  }

  const db = supabaseAdmin();

  // Upsert into workspace_entitlements
  const { error } = await db.from("workspace_entitlements").upsert(
    {
      workspace_id: workspaceId,
      key: entitlementKey,
      enabled: true,
      payload: {
        version: 1,
        meta: {
          source: "owner_console",
          note: reason || `Granted by ${grantedByEmail}`,
          granted_by: grantedBy,
          granted_by_email: grantedByEmail,
          granted_at: new Date().toISOString(),
          ...(expiresAt ? { expires_at: expiresAt } : {}),
        },
      },
      expires_at: expiresAt || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "workspace_id,key",
    }
  );

  if (error) {
    logger.error("[grantEntitlement] Error:", error);
    return { success: false, error: error.message };
  }

  // Create audit log
  await recordOwnerAudit({
    action: "entitlement.grant",
    actorEmail: grantedByEmail,
    actorRole: "platform_admin",
    workspaceId: workspaceId,
    meta: {
      entitlement_key: entitlementKey,
      reason: reason || null,
      expires_at: expiresAt || null,
    },
  });

  return { success: true };
}

/**
 * Revoke an entitlement from a workspace
 */
export async function revokeEntitlement(params: RevokeEntitlementParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const { workspaceId, entitlementKey, revokedBy, revokedByEmail, reason } = params;

  const db = supabaseAdmin();

  // Update to disabled
  const { error } = await db
    .from("workspace_entitlements")
    .update({
      enabled: false,
      payload: {
        version: 1,
        meta: {
          source: "owner_console",
          note: reason || `Revoked by ${revokedByEmail}`,
          revoked_by: revokedBy,
          revoked_by_email: revokedByEmail,
          revoked_at: new Date().toISOString(),
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("key", entitlementKey);

  if (error) {
    logger.error("[revokeEntitlement] Error:", error);
    return { success: false, error: error.message };
  }

  // Create audit log
  await recordOwnerAudit({
    action: "entitlement.revoke",
    actorEmail: revokedByEmail,
    actorRole: "platform_admin",
    workspaceId: workspaceId,
    meta: {
      entitlement_key: entitlementKey,
      reason: reason || null,
    },
  });

  return { success: true };
}

/**
 * Grant all entitlements to a workspace
 */
export async function grantAllEntitlements(params: {
  workspaceId: string;
  grantedBy: string;
  grantedByEmail: string;
  reason?: string;
  expiresAt?: string;
}): Promise<{ success: boolean; granted: string[]; errors: string[] }> {
  const granted: string[] = [];
  const errors: string[] = [];

  for (const key of ENTITLEMENT_KEYS) {
    const result = await grantEntitlement({
      workspaceId: params.workspaceId,
      entitlementKey: key,
      grantedBy: params.grantedBy,
      grantedByEmail: params.grantedByEmail,
      reason: params.reason || "Bulk unlock all products",
      expiresAt: params.expiresAt,
    });

    if (result.success) {
      granted.push(key);
    } else {
      errors.push(`${key}: ${result.error}`);
    }
  }

  return { success: errors.length === 0, granted, errors };
}

/**
 * Revoke all entitlements from a workspace (reset to plan-only)
 */
export async function revokeAllEntitlements(params: {
  workspaceId: string;
  revokedBy: string;
  revokedByEmail: string;
  reason?: string;
}): Promise<{ success: boolean; revoked: string[]; errors: string[] }> {
  const revoked: string[] = [];
  const errors: string[] = [];

  for (const key of ENTITLEMENT_KEYS) {
    const result = await revokeEntitlement({
      workspaceId: params.workspaceId,
      entitlementKey: key,
      revokedBy: params.revokedBy,
      revokedByEmail: params.revokedByEmail,
      reason: params.reason || "Bulk reset to plan",
    });

    if (result.success) {
      revoked.push(key);
    } else {
      errors.push(`${key}: ${result.error}`);
    }
  }

  return { success: errors.length === 0, revoked, errors };
}

/**
 * Get workspace with full entitlement details
 */
export async function getWorkspaceWithEntitlements(
  workspaceId: string
): Promise<WorkspaceWithEntitlements | null> {
  const db = supabaseAdmin();

  // Get workspace
  const { data: workspace, error: wsError } = await db
    .from("workspaces")
    .select("id, name, slug, created_at, owner_id")
    .eq("id", workspaceId)
    .single();

  if (wsError || !workspace) {
    return null;
  }

  // Get owner profile
  const { data: ownerProfile } = await db
    .from("profiles")
    .select("email")
    .eq("id", workspace.owner_id)
    .single();

  // Get subscription
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_code, status")
    .eq("workspace_id", workspaceId)
    .single();

  // Get entitlements
  const { data: entitlements } = await db
    .from("workspace_entitlements")
    .select("key, enabled, payload, expires_at, updated_at")
    .eq("workspace_id", workspaceId);

  // Map entitlements with source detection
  type EntitlementItem = {
    key: string;
    enabled: boolean;
    source: "plan" | "grant";
    granted_by: string | null;
    granted_at: string | null;
    reason: string | null;
    expires_at: string | null;
  };

  const entitlementList: EntitlementItem[] = (entitlements ?? []).map((ent) => {
    const payload = (ent.payload as Record<string, unknown>) ?? {};
    const meta = (payload.meta as Record<string, unknown>) ?? {};
    
    return {
      key: ent.key,
      enabled: Boolean(ent.enabled),
      source: "grant" as const,
      granted_by: (meta.granted_by_email as string) || null,
      granted_at: (meta.granted_at as string) || ent.updated_at || null,
      reason: (meta.note as string) || null,
      expires_at: ent.expires_at || null,
    };
  });

  // Add missing entitlements as locked
  for (const key of ENTITLEMENT_KEYS) {
    if (!entitlementList.find((e) => e.key === key)) {
      entitlementList.push({
        key,
        enabled: false,
        source: "plan" as const,
        granted_by: null,
        granted_at: null,
        reason: null,
        expires_at: null,
      });
    }
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    created_at: workspace.created_at,
    owner_email: ownerProfile?.email || null,
    plan_code: subscription?.plan_code || "free_locked",
    subscription_status: subscription?.status || "unknown",
    entitlements: entitlementList.sort((a, b) => a.key.localeCompare(b.key)),
  };
}

/**
 * Search workspaces by name or slug
 */
export async function searchWorkspaces(query: string): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    owner_email: string | null;
    created_at: string | null;
  }>
> {
  const db = supabaseAdmin();

  if (!query || query.length < 2) {
    // Return recent workspaces if no query
    const { data } = await db
      .from("workspaces")
      .select("id, name, slug, owner_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const workspaces = data ?? [];
    
    // Get owner emails
    const ownerIds = workspaces.map((w) => w.owner_id).filter(Boolean);
    const { data: profiles } = await db
      .from("profiles")
      .select("id, email")
      .in("id", ownerIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.email]));

    return workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      owner_email: profileMap.get(w.owner_id) || null,
      created_at: w.created_at,
    }));
  }

  // Search by name or slug
  const { data } = await db
    .from("workspaces")
    .select("id, name, slug, owner_id, created_at")
    .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  const workspaces = data ?? [];

  // Get owner emails
  const ownerIds = workspaces.map((w) => w.owner_id).filter(Boolean);
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email")
    .in("id", ownerIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  return workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    owner_email: profileMap.get(w.owner_id) || null,
    created_at: w.created_at,
  }));
}
