import { redirect } from "next/navigation";
import PlanCard from "@/components/app/PlanCard";
import ComparePlans from "@/components/app/ComparePlans";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlanMeta, planMeta } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id, billing_mode, seat_limit, status")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");

  return (
    <div className="space-y-6">
      <PlanCard
        plan={plan}
        status={subscription?.status}
        seatLimit={subscription?.seat_limit}
      />

      <ComparePlans plans={planMeta} />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Upgrade CTA</h2>
        <p className="text-sm text-white/60 mt-2">
          Billing integration is coming soon. For upgrades or token purchases,
          contact sales@gigaviz.com.
        </p>
      </section>
    </div>
  );
}
