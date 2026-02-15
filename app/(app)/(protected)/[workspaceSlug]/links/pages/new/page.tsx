import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { CreateLinkPage } from "@/components/links/CreateLinkPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ workspaceSlug: string }> };

export default async function NewLinkPageRoute({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "links");

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <CreateLinkPage workspaceSlug={workspaceSlug} />
    </FeatureGate>
  );
}
