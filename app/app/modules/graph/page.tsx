import { redirect } from "next/navigation";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function GraphModulePage() {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const allowed = canAccess({ plan_id: plan.plan_id, is_admin: isAdmin }, "graph");

  if (!allowed) {
    return (
      <LockedScreen
        title="Graph is locked"
        description="Upgrade to generate graph visuals and insights."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Graph</h1>
      <p className="text-sm text-white/60">
        Stub module. Generate charts, imagery, and analytics exports.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Graph generation actions consume tokens on execution.
      </div>
    </div>
  );
}
