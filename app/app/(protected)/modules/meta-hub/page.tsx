import { redirect } from "next/navigation";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function MetaHubModulePage() {
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
  const allowed = canAccess({ plan_id: plan.plan_id, is_admin: isAdmin }, "meta_hub");

  if (!allowed) {
    return (
      <LockedScreen
        title="Meta Hub is locked"
        description="Upgrade to unlock Meta Hub messaging and automation."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Meta Hub</h1>
      <p className="text-sm text-white/60">
        Stub module. Manage templates, send messages, and connect Meta tools.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Meta Hub actions consume tokens (see rate card).
      </div>
    </div>
  );
}
