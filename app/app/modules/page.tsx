import { redirect } from "next/navigation";
import ModuleGrid from "@/components/app/ModuleGrid";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta, type FeatureKey } from "@/lib/entitlements";

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

export default async function ModulesPage() {
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

  const moduleCards = modules.map((module) => ({
    ...module,
    locked: !canAccess({ plan_id: plan.plan_id, is_admin: isAdmin }, module.feature),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Modules</h1>
        <p className="text-sm text-white/60">
          Explore every module. Locked modules require a paid plan.
        </p>
      </div>
      <ModuleGrid
        modules={moduleCards.map((module) => ({
          key: module.key,
          name: module.name,
          description: module.description,
          href: module.href,
          locked: module.locked,
        }))}
      />
    </div>
  );
}
