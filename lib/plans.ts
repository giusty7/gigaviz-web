import "server-only";

import { getPlanMeta, type PlanId } from "@/lib/entitlements";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type WorkspacePlan = {
  planId: PlanId;
  plan: ReturnType<typeof getPlanMeta>;
  status?: string | null;
  seatLimit?: number | null;
  devOverride?: boolean;
  devEmail?: string | null;
  displayName: string;
  source?: "subscription" | "dev-override";
};

export async function getWorkspacePlan(workspaceId: string): Promise<WorkspacePlan> {
  const devEmails = (process.env.DEV_FULL_ACCESS_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  let devEmail: string | null = null;
  if (devEmails.length > 0) {
    try {
      const supabase = await supabaseServer();
      const { data } = await supabase.auth.getUser();
      const email = (data.user?.email || "").toLowerCase();
      if (email && devEmails.includes(email)) {
        devEmail = email;
      }
    } catch {
      // ignore – if we can't read user, no override
    }
  }

  if (devEmail) {
    const plan = getPlanMeta("team_pro");
    return {
      planId: "team_pro",
      plan,
      status: "dev_override",
      seatLimit: null,
      devOverride: true,
      devEmail,
      displayName: `${plan.name} (Dev Override)`,
      source: "dev-override",
    };
  }

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
    devOverride: false,
    devEmail: null,
    displayName: plan.name,
    source: "subscription",
  };
}
