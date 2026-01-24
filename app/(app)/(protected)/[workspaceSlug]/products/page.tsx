import { redirect } from "next/navigation";
import ImperiumModulesClient from "@/components/app/ImperiumModulesClient";
import type { ModuleItem } from "@/components/app/ImperiumModuleGrid";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlanMeta, planMeta } from "@/lib/entitlements";
import { COPY_EN } from "@/lib/copy/en";
import { buildModuleRegistry } from "@/lib/modules/registry";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;

  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/products`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const userEmail = ctx.user.email ?? "";

  const moduleRegistry = buildModuleRegistry({
    workspaceSlug: workspace.slug,
    planId: plan.plan_id,
    isAdmin: Boolean(ctx.profile?.is_admin),
    effectiveEntitlements: ctx.effectiveEntitlements,
  }).slice(0, 10);

  const moduleCards: ModuleItem[] = moduleRegistry.map((module) => ({
    key: module.key,
    name: module.name,
    description: module.description,
    status: module.status,
    href: module.href,
    accessLabel: module.accessLabel,
    notifyLabel: COPY_EN.hubs.notifyMe,
    comingSoonLabel: COPY_EN.hubs.statusComingSoon,
  }));

  return (
    <ImperiumModulesClient
      modules={moduleCards}
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
      userEmail={userEmail}
      planOptions={planMeta}
      defaultPlanId={plan.plan_id}
      title={COPY_EN.hubs.catalogTitle}
      subtitle={COPY_EN.hubs.catalogSubtitle}
    />
  );
}
