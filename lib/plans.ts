import "server-only";

import { getPlanMeta, type PlanId } from "@/lib/entitlements";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type WorkspacePlan = {
  planId: PlanId;
  plan: ReturnType<typeof getPlanMeta>;
  status?: string | null;
  seatLimit?: number | null;
};

export async function getWorkspacePlan(workspaceId: string): Promise<WorkspacePlan> {
  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id, status, seat_limit")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const planId = (subscription?.plan_id as PlanId | null) ?? "free_locked";
  const plan = getPlanMeta(planId);

  return {
    planId,
    plan,
    status: subscription?.status ?? null,
    seatLimit: subscription?.seat_limit ?? null,
  };
}
