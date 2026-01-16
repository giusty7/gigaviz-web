import { redirect } from "next/navigation";
import ImperiumModulesClient from "@/components/app/ImperiumModulesClient";
import type { ModuleStatus } from "@/components/app/ImperiumModuleGrid";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlanMeta, planMeta } from "@/lib/entitlements";
import { COPY_EN } from "@/lib/copy/en";
import { HUBS } from "@/lib/hubs";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type ModulesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function ModulesPage({ params }: ModulesPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;

  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/modules`);
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
  const basePath = `/${workspace.slug}`;

  const moduleCards = HUBS.map((hub) => {
    const status: ModuleStatus = hub.status === "OPEN" ? "available" : "coming_soon";
    const targetHref = `${basePath}/${hub.slug}`;
    return {
      key: hub.slug,
      name: hub.title,
      description: hub.description,
      status,
      href: hub.status === "OPEN" ? targetHref : undefined,
      previewHref: hub.status === "COMING_SOON" ? targetHref : undefined,
      previewLabel: "Preview",
      notifyLabel: COPY_EN.hubs.notifyMe,
      comingSoonLabel: COPY_EN.hubs.statusComingSoon,
    };
  });

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

