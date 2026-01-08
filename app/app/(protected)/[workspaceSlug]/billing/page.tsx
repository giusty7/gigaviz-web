import Link from "next/link";
import { redirect } from "next/navigation";
import PlanCard from "@/components/app/PlanCard";
import ComparePlans from "@/components/app/ComparePlans";
import { Button } from "@/components/ui/button";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlanMeta, planMeta } from "@/lib/entitlements";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  if (ctx.currentWorkspace.slug !== workspaceSlug) {
    redirect(`/app/${ctx.currentWorkspace.slug}/billing`);
  }

  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

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
        workspaceSlug={ctx.currentWorkspace.slug}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Tiers at a glance</h2>
        <p className="text-sm text-white/60 mt-2">
          Pilih tier sesuai kebutuhan individu atau tim.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            {
              name: "Individual",
              description: "Untuk solo founder atau operator.",
              features: [
                "1 seat",
                "Dashboard + tokens wallet",
                "Unlock modules sesuai plan",
              ],
            },
            {
              name: "Team",
              description: "Untuk workspace yang dipakai bersama.",
              features: [
                "Multi-seat collaboration",
                "Member roles & access",
                "Shared token wallet + reporting",
              ],
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <h3 className="text-base font-semibold">{tier.name}</h3>
              <p className="text-sm text-white/60 mt-1">{tier.description}</p>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Token usage</h2>
        <p className="text-sm text-white/60 mt-2">
          Token usage terpisah dari subscription. Gunakan estimator di halaman
          Tokens untuk perkiraan kebutuhan.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Upgrade CTA</h2>
        <p className="text-sm text-white/60 mt-2">
          Billing integration is coming soon. Hubungi sales untuk upgrade atau
          custom needs.
        </p>
        <div className="mt-4">
          <Button asChild variant="secondary">
            <Link href="mailto:sales@gigaviz.com">Contact sales / Upgrade</Link>
          </Button>
        </div>
      </section>

      <ComparePlans plans={planMeta} />
    </div>
  );
}
