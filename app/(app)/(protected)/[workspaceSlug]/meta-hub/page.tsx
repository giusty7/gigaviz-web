import { redirect } from "next/navigation";
import { ImperiumMetaHubOverviewClient } from "@/components/meta-hub/ImperiumMetaHubOverviewClient";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { getMetaHubOverview } from "@/lib/meta/overview-data";
import { getAppContext } from "@/lib/app-context";
import { canAccess } from "@/lib/entitlements";
import { getWorkspacePlan } from "@/lib/plans";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubOverviewPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;

  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const planInfo = await getWorkspacePlan(workspace.id);
  const isDevOverride = Boolean(planInfo.devOverride);
  const isPreview = planInfo.planId === "free_locked" && !isDevOverride;
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const entitlementCtx = { plan_id: planInfo.planId, is_admin: isAdmin || isDevOverride };
  const allowTemplates = canAccess(entitlementCtx, "meta_templates");
  const allowSend = canAccess(entitlementCtx, "meta_send");

  const overview = await getMetaHubOverview(workspace.id);
  const flags = getMetaHubFlags();
  const basePath = `/${workspace.slug}/meta-hub`;
  const planLabel = isDevOverride ? "DEV (Full Access)" : planInfo.displayName;

  const channels = [
    {
      name: "WhatsApp",
      status: (flags.waEnabled ? "live" : "beta") as "live" | "beta" | "soon",
      desc: "Template, inbox, scheduler.",
      stats: [
        overview.health.whatsapp.connected ? "Connected" : "Not connected",
        `${overview.kpis.templates.approved ?? "—"} approved templates`,
      ],
      href: `${basePath}/messaging/whatsapp`,
    },
    {
      name: "Instagram",
      status: (flags.igEnabled ? "beta" : "soon") as "live" | "beta" | "soon",
      desc: "DM API, webhook events.",
      stats: ["Preview", "DM & mention"],
      href: `${basePath}/messaging/instagram`,
    },
    {
      name: "Messenger",
      status: (flags.msEnabled ? "beta" : "soon") as "live" | "beta" | "soon",
      desc: "Send/receive messages.",
      stats: ["Preview", "Inbox"],
      href: `${basePath}/messaging/messenger`,
    },
    {
      name: "Ads",
      status: (flags.adsEnabled ? "beta" : "soon") as "live" | "beta" | "soon",
      desc: "Campaign management & audiences.",
      stats: ["Preview", "Campaigns"],
      href: `${basePath}/ads`,
    },
    {
      name: "Insights",
      status: (flags.insightsEnabled ? "beta" : "soon") as "live" | "beta" | "soon",
      desc: "Performance and alerts.",
      stats: ["Preview", "Analytics"],
      href: `${basePath}/insights`,
    },
  ];

  return (
    <ImperiumMetaHubOverviewClient
      basePath={basePath}
      planLabel={planLabel}
      isDevOverride={isDevOverride}
      isPreview={isPreview}
      allowTemplates={allowTemplates}
      allowSend={allowSend}
      health={overview.health}
      kpis={overview.kpis}
      alerts={overview.alerts}
      recentEvents={overview.recentEvents}
      recentConversations={overview.recentConversations}
      channels={channels}
    />
  );
}
