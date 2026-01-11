import Link from "next/link";
import { redirect } from "next/navigation";
import PreviewBanner from "@/components/modules/preview-banner";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { getAppContext } from "@/lib/app-context";
import { getWorkspacePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

type BillingPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function PlatformBillingPage({ params }: BillingPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;

  const planInfo = await getWorkspacePlan(workspace.id);
  const isDevOverride = Boolean(planInfo.devOverride);
  const isPreview = planInfo.planId === "free_locked" && !isDevOverride;
  const planLabel = isDevOverride ? "DEV (Full Access)" : planInfo.displayName;

  return (
    <div className="space-y-4">
      {isPreview && <PreviewBanner />}

      <Card className="bg-card/80">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Billing &amp; Paket</CardTitle>
            <CardDescription>Kelola paket, pembayaran, dan batasan.</CardDescription>
          </div>
          <Badge variant="outline" className="border-gigaviz-gold text-gigaviz-gold">
            {planLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="font-semibold">{planLabel}</p>
            <p className="text-xs text-muted-foreground">
              {planInfo.status ?? copy.emptyStates.billing.helper}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isDevOverride && <UpgradeButton label="Upgrade" />}
            <Button asChild variant="outline" size="sm">
              <Link href={`/${workspaceSlug}/billing`}>Buka halaman billing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

