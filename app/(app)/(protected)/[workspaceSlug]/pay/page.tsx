import { redirect } from "next/navigation";
import { HubPreviewPage } from "@/components/hubs/HubPreviewPage";
import { FeatureGate } from "@/components/gates/feature-gate";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HUBS } from "@/lib/hubs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function PayHubPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "pay");

  const hub = HUBS.find((item) => item.slug === "pay");
  if (!hub) return <div className="text-sm text-muted-foreground">Hub not found.</div>;

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <HubPreviewPage hub={hub} workspaceSlug={ctx.currentWorkspace.slug} />
    </FeatureGate>
  );
}
