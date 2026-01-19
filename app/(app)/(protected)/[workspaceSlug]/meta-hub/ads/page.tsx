import { redirect } from "next/navigation";
import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import { getAppContext } from "@/lib/app-context";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubAdsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub/ads`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const flags = getMetaHubFlags();
  const badgeStatus = flags.adsEnabled ? "beta" : "soon";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Ads</h2>
          <p className="text-sm text-muted-foreground">
            Manage campaigns, audiences, and ad performance from the Meta Hub.
          </p>
        </div>
        <MetaHubBadge status={badgeStatus} />
      </div>
      <DisabledModuleState
        title="Ads"
        description="Not configured yet. Connect an ad account to launch, monitor, and optimize campaigns."
        workspaceId={workspace.id}
        moduleSlug="ads"
        moduleName="Meta Ads"
        badgeStatus={badgeStatus}
      />
    </div>
  );
}

