import { redirect } from "next/navigation";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function OfficeModulePage() {
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
  const allowed = canAccess({ plan_id: plan.plan_id, is_admin: isAdmin }, "office");

  if (!allowed) {
    return (
      <LockedScreen
        title="Office is locked"
        description="Upgrade to access Office automations and exports."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Office</h1>
      <p className="text-sm text-white/60">
        Stub module. Configure office automation workflows and exports.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Office exports consume tokens on execution.
      </div>
    </div>
  );
}
