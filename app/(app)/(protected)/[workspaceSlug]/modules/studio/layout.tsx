import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import LockedScreen from "@/components/app/LockedScreen";
import { StudioLayoutShell } from "@/components/studio/StudioSidebar";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanFeatures, getPlanMeta, type FeatureKey } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function StudioLayout({ children, params }: LayoutProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/modules/studio`);
  }

  await ensureWorkspaceCookie(workspace.id);

  // Resolve plan
  const db = await supabaseServer();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const planFeatures = getPlanFeatures(plan.plan_id);
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const ents = ctx.effectiveEntitlements ?? [];

  // Check access for each sub-module
  const checkAccess = (feature: FeatureKey) =>
    canAccess(
      { plan_id: plan.plan_id, is_admin: isAdmin, effectiveEntitlements: ents },
      feature
    );

  const access = {
    office: checkAccess("office"),
    graph: checkAccess("graph"),
    tracks: checkAccess("tracks"),
  };

  // Studio hub itself requires at least one sub-module or studio entitlement
  const hasAnyStudioAccess = access.office || access.graph || access.tracks || checkAccess("studio");

  const planHasStudio = planFeatures.includes("studio") || planFeatures.includes("office");
  const ownerGrantActive =
    !isAdmin &&
    Boolean(ents.includes("studio") || ents.includes("office")) &&
    !planHasStudio;

  const basePath = `/${workspace.slug}/modules/studio`;

  if (!hasAnyStudioAccess) {
    return (
      <StudioLayoutShell basePath={basePath} access={access}>
        <LockedScreen
          title="Studio Suite is locked"
          description="Upgrade your plan to unlock Office, Graph, and Tracks — your AI-powered creative suite."
          workspaceSlug={workspace.slug}
        />
      </StudioLayoutShell>
    );
  }

  return (
    <StudioLayoutShell
      basePath={basePath}
      access={access}
      ownerGrantActive={ownerGrantActive}
    >
      {children}
    </StudioLayoutShell>
  );
}
