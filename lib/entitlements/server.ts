import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getPlanFeatures,
  getPlanMeta,
  planMeta,
  type FeatureKey,
  type PlanId,
} from "@/lib/entitlements";

export type WorkspaceEntitlements = {
  planId: PlanId;
  features: Record<FeatureKey, boolean>;
  limits: Record<string, unknown>;
  payloads: Record<string, unknown>;
};

const ownerEntitlementKeys: FeatureKey[] = [
  // 10 Hubs
  "core_os",
  "meta_hub",
  "studio",
  "helper",
  "office",
  "marketplace",
  "arena",
  "pay",
  "trade",
  "community",
  // Capabilities
  "inbox",
  "automation",
  "studio_graph",
  "wa_blast",
  "mass_blast",
  "analytics",
];

const featureUniverse: FeatureKey[] = Array.from(
  new Set([
    ...planMeta.flatMap((p) => getPlanFeatures(p.plan_id)),
    ...ownerEntitlementKeys,
  ])
) as FeatureKey[];

function normalizePlan(planId?: string | null): PlanId {
  return getPlanMeta(planId)?.plan_id ?? "free_locked";
}

function buildBaseFeatures(planId: PlanId) {
  const base: Record<FeatureKey, boolean> = {} as Record<FeatureKey, boolean>;
  featureUniverse.forEach((key) => {
    base[key] = getPlanFeatures(planId).includes(key);
  });
  return base;
}

export async function getWorkspaceEntitlements(workspaceId: string): Promise<WorkspaceEntitlements> {
  const db = supabaseAdmin();

  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const planId = normalizePlan(subscription?.plan_id);
  const features = buildBaseFeatures(planId);
  const limits: Record<string, unknown> = {};
  const payloads: Record<string, unknown> = {};

  const { data: overrides, error } = await db
    .from("workspace_entitlements")
    .select("key, enabled, payload")
    .eq("workspace_id", workspaceId);

  if (!error) {
    (overrides ?? []).forEach(
      (row: { key: string; enabled?: boolean | null; payload?: unknown }) => {
        if (!row || typeof row.key !== "string") return;
        const key = row.key as FeatureKey;
        const enabled = row.enabled ?? false;
        const payload = row.payload ?? {};

        if ((featureUniverse as string[]).includes(key)) {
          features[key] = enabled;
          payloads[key] = payload;
          limits[key] = payload;
          return;
        }

        limits[row.key] = payload;
      }
    );
  } else {
    const { data: legacy } = await db
      .from("workspace_entitlements")
      .select("key, value")
      .eq("workspace_id", workspaceId);

    (legacy ?? []).forEach((row: { key: string; value: unknown }) => {
      if (!row || typeof row.key !== "string") return;
      const key = row.key as FeatureKey;
      const val = row.value;
      if (typeof val === "boolean" && (featureUniverse as string[]).includes(key)) {
        features[key] = val;
        return;
      }
      limits[row.key] = val;
    });
  }

  return { planId, features, limits, payloads };
}

export async function requireEntitlement(
  workspaceId: string,
  feature: FeatureKey
): Promise<{ allowed: true; entitlements: WorkspaceEntitlements } | { allowed: false }> {
  const entitlements = await getWorkspaceEntitlements(workspaceId);
  if (!entitlements.features[feature]) {
    return { allowed: false };
  }
  return { allowed: true, entitlements };
}
