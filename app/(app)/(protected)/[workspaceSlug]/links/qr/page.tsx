import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { supabaseServer } from "@/lib/supabase/server";
import { LinksQRCodes } from "@/components/links/LinksQRCodes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ workspaceSlug: string }> };

export default async function LinksQRPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "links");
  const db = await supabaseServer();

  // Fetch published pages for QR generation
  const { data: pages } = await db
    .from("link_pages")
    .select("id, title, slug, published")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("title");

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <LinksQRCodes workspaceSlug={workspaceSlug} pages={pages ?? []} />
    </FeatureGate>
  );
}
