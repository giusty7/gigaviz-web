import { redirect } from "next/navigation";
import { HubPreviewPage } from "@/components/hubs/HubPreviewPage";
import { getAppContext } from "@/lib/app-context";
import { HUBS } from "@/lib/hubs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MarketplaceHubPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const hub = HUBS.find((item) => item.slug === "marketplace");
  if (!hub) return <div className="text-sm text-muted-foreground">Hub not found.</div>;

  return <HubPreviewPage hub={hub} workspaceSlug={ctx.currentWorkspace.slug} />;
}
