import { redirect } from "next/navigation";
import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import { getAppContext } from "@/lib/app-context";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubInsightsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub/insights`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const flags = getMetaHubFlags();
  const badgeStatus = flags.insightsEnabled ? "beta" : "soon";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Insights</h2>
          <p className="text-sm text-muted-foreground">
            Surface performance signals and alerts across Meta channels.
          </p>
        </div>
        <MetaHubBadge status={badgeStatus} />
      </div>
      <DisabledModuleState
        title="Insights"
        description="Not configured yet. Connect data sources to unlock performance dashboards and alerts."
        workspaceId={workspace.id}
        moduleSlug="insights"
        moduleName="Insights"
        badgeStatus={badgeStatus}
      />
    </div>
  );
}
