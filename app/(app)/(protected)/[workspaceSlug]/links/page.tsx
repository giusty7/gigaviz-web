import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { HubPreviewPage } from "@/components/hubs/HubPreviewPage";
import { HUBS } from "@/lib/hubs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function LinksPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "links");
  const hub = HUBS.find((h) => h.slug === "links")!;

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <HubPreviewPage hub={hub} workspaceSlug={workspaceSlug} />
    </FeatureGate>
  );
}
