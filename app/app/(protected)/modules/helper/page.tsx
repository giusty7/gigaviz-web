import { redirect } from "next/navigation";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function HelperModulePage() {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const allowed = canAccess({ plan_id: plan.plan_id, is_admin: isAdmin }, "helper");

  if (!allowed) {
    return (
      <LockedScreen
        title="Helper is locked"
        description="Upgrade your plan to access Helper chat and tokenized responses."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Helper</h1>
      <p className="text-sm text-white/60">
        Stub module. Add your assistant workflows and tokenized actions here.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Helper actions will consume tokens (see /app/tokens for rates).
      </div>
    </div>
  );
}
