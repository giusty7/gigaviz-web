import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta, type FeatureKey } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Shared auth + entitlement helper for Studio API routes.
 *
 * Resolves workspace context, fetches subscription, checks feature entitlement.
 * Returns `{ ctx, db }` on success, `null` if access denied.
 *
 * @param feature — The Studio feature key to check ("graph" | "office" | "tracks" | "studio")
 */
export async function requireStudioAccess(feature: FeatureKey) {
  const ctx = await getAppContext();
  if (!ctx.user || !ctx.currentWorkspace) return null;

  const db = await supabaseServer();
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(sub?.plan_id || "free_locked");
  const ents = ctx.effectiveEntitlements ?? [];
  const hasAccess = canAccess(
    { plan_id: plan.plan_id, is_admin: Boolean(ctx.profile?.is_admin), effectiveEntitlements: ents },
    feature
  );

  return hasAccess ? { ctx, db } : null;
}
