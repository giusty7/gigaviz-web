import { redirect } from "next/navigation";
import PreviewBanner from "@/components/modules/preview-banner";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { getAppContext } from "@/lib/app-context";
import { getWorkspacePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function AuditPage({ params }: AuditPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");
  const workspace = ctx.currentWorkspace;

  const planInfo = await getWorkspacePlan(workspace.id);
  const isPreview = planInfo.planId === "free_locked";

  const demoEvents = [
    { action: "auth.login", actor: ctx.user.email ?? "user", time: "baru saja" },
    { action: "workspace.update", actor: "ops@gigaviz.com", time: "2h lalu" },
  ];

  return (
    <div className="space-y-4">
      {isPreview && <PreviewBanner />}

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>Preview aktivitas penting yang akan tercatat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {demoEvents.map((evt) => (
            <div
              key={`${evt.action}-${evt.time}`}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
            >
              <div>
                <p className="font-semibold">{evt.action}</p>
                <p className="text-xs text-muted-foreground">{evt.actor}</p>
              </div>
              <span className="text-xs text-muted-foreground">{evt.time}</span>
            </div>
          ))}

          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="font-semibold">{copy.emptyStates.audit.title}</p>
            <p className="text-muted-foreground">{copy.emptyStates.audit.helper}</p>
          </div>

          <UpgradeButton label="Upgrade untuk audit penuh" variant="outline" size="sm" />
        </CardContent>
      </Card>
    </div>
  );
}
