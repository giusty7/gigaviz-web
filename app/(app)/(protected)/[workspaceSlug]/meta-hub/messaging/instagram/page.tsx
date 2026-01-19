import { redirect } from "next/navigation";
import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import { getAppContext } from "@/lib/app-context";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubInstagramPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub/messaging/instagram`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const flags = getMetaHubFlags();
  const badgeStatus = flags.igEnabled ? "beta" : "soon";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Instagram Messaging</h2>
          <p className="text-sm text-muted-foreground">
            Connect Instagram DMs, story replies, and webhook events when support is ready.
          </p>
        </div>
        <MetaHubBadge status={badgeStatus} />
      </div>
      <DisabledModuleState
        title="Instagram Messaging"
        description="Not configured yet. Enable the DM API and webhook bridge to reply from the Meta Hub."
        workspaceId={workspace.id}
        moduleSlug="instagram"
        moduleName="Instagram Messaging"
        badgeStatus={badgeStatus}
      />
    </div>
  );
}
