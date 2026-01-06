import { redirect } from "next/navigation";
import PlanCard from "@/components/app/PlanCard";
import TokenCard from "@/components/app/TokenCard";
import ModuleGrid from "@/components/app/ModuleGrid";
import ComparePlans from "@/components/app/ComparePlans";
import AdminPanel from "@/components/app/AdminPanel";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta, planMeta, type FeatureKey } from "@/lib/entitlements";
import { getWallet } from "@/lib/tokens";

export const dynamic = "force-dynamic";

const modules: Array<{
  key: string;
  name: string;
  description: string;
  href: string;
  feature: FeatureKey;
}> = [
  {
    key: "helper",
    name: "Helper",
    description: "AI-assisted responses with policy-safe guardrails.",
    href: "/app/modules/helper",
    feature: "helper",
  },
  {
    key: "office",
    name: "Office",
    description: "Automate docs, exports, and internal ops.",
    href: "/app/modules/office",
    feature: "office",
  },
  {
    key: "graph",
    name: "Graph",
    description: "Generate visuals and data-driven insights.",
    href: "/app/modules/graph",
    feature: "graph",
  },
  {
    key: "tracks",
    name: "Tracks",
    description: "Workflow orchestration and journey tracking.",
    href: "/app/modules/tracks",
    feature: "tracks",
  },
  {
    key: "meta-hub",
    name: "Meta Hub",
    description: "Meta automation, templates, and compliance tools.",
    href: "/app/modules/meta-hub",
    feature: "meta_hub",
  },
];

export default async function AppHomePage() {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id, billing_mode, seat_limit, status")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);

  const wallet = await getWallet(ctx.currentWorkspace.id);
  const balance = Number(wallet.balance_bigint ?? 0);

  const moduleCards = modules.map((module) => ({
    ...module,
    locked: !canAccess(
      { plan_id: plan.plan_id, is_admin: isAdmin },
      module.feature
    ),
  }));

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-2">
        <PlanCard
          plan={plan}
          status={subscription?.status}
          seatLimit={subscription?.seat_limit}
        />
        <TokenCard balance={balance} />
      </section>

      {plan.plan_id === "free_locked" && !isAdmin && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Free Locked (Beta)</h2>
          <p className="text-sm text-white/70 mt-2">
            Free tier sementara dikunci untuk mencegah abuse dan menjaga
            reliability/compliance. Upgrade untuk membuka semua modul.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Modules</h2>
        <ModuleGrid
          modules={moduleCards.map((module) => ({
            key: module.key,
            name: module.name,
            description: module.description,
            href: module.href,
            locked: module.locked,
          }))}
        />
      </section>

      <ComparePlans plans={planMeta} />

      {isAdmin && (
        <AdminPanel
          workspaceId={ctx.currentWorkspace.id}
          enableBillingTestMode={process.env.ENABLE_BILLING_TEST_MODE === "true"}
        />
      )}
    </div>
  );
}
