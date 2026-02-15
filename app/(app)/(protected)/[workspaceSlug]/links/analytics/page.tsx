import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { supabaseServer } from "@/lib/supabase/server";
import { LinksAnalytics } from "@/components/links/LinksAnalytics";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ workspaceSlug: string }> };

export default async function LinksAnalyticsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "links");
  const db = await supabaseServer();
  const workspaceId = ctx.currentWorkspace.id;

  // Fetch pages for filter
  const { data: pages } = await db
    .from("link_pages")
    .select("id, title, slug")
    .eq("workspace_id", workspaceId)
    .order("title");

  // Fetch recent clicks (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();
  const { data: clicks } = await db
    .from("link_clicks")
    .select("item_id, page_id, clicked_at, device_type")
    .eq("workspace_id", workspaceId)
    .gte("clicked_at", since)
    .order("clicked_at", { ascending: false })
    .limit(5000);

  // Fetch items for labels
  const { data: items } = await db
    .from("link_items")
    .select("id, title, page_id, link_type")
    .eq("workspace_id", workspaceId);

  // Pre-compute last 14 days on server
  const today = new Date();
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <LinksAnalytics
        workspaceSlug={workspaceSlug}
        pages={pages ?? []}
        clicks={clicks ?? []}
        items={items ?? []}
        last14Days={last14Days}
      />
    </FeatureGate>
  );
}
