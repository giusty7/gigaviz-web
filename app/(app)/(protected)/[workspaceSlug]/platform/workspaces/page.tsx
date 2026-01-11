import { redirect } from "next/navigation";
import { ActionGate } from "@/components/gates/action-gate";
import PreviewBanner from "@/components/modules/preview-banner";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { getAppContext } from "@/lib/app-context";
import { canAccess } from "@/lib/entitlements";
import { getWorkspacePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

type WorkspacesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function PlatformWorkspacesPage({ params }: WorkspacesPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;

  const planInfo = await getWorkspacePlan(workspace.id);
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const isPreview = planInfo.planId === "free_locked";

  const allowInvite = canAccess(
    { plan_id: planInfo.planId, is_admin: isAdmin },
    "member_invites"
  );

  return (
    <div className="space-y-4">
      {isPreview && <PreviewBanner />}

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Daftar Workspace</CardTitle>
          <CardDescription>Preview workspace yang Anda miliki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ctx.workspaces.length === 0 ? (
            <div className="rounded-xl border border-border bg-background px-4 py-6 text-sm">
              <p className="font-semibold">{copy.emptyStates.workspace.title}</p>
              <p className="text-muted-foreground">{copy.emptyStates.workspace.helper}</p>
            </div>
          ) : (
            ctx.workspaces.map((ws) => (
              <div
                key={ws.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{ws.name}</p>
                  <p className="text-xs text-muted-foreground">{ws.slug}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{ws.role}</span>
                </div>
              </div>
            ))
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Tambah Workspace
            </Button>
            <ActionGate allowed={allowInvite}>
              <Button size="sm">Undang Member</Button>
            </ActionGate>
            <UpgradeButton label="Upgrade" variant="ghost" size="sm" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

