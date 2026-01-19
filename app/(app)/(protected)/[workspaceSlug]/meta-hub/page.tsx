import { redirect } from "next/navigation";
import { ImperiumMetaHubOverviewClient } from "@/components/meta-hub/ImperiumMetaHubOverviewClient";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { getMetaHubAccess } from "@/lib/meta-hub/access";
import { getMetaHubOverview } from "@/lib/meta/overview-data";
import { getAppContext } from "@/lib/app-context";
import { getWorkspacePlan } from "@/lib/plans";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

type ChannelStatus = "live" | "beta" | "soon" | "locked";

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
  const isAdmin = Boolean(ctx.profile?.is_admin) || isDevOverride;
  const access = getMetaHubAccess({ planId: planInfo.planId, isAdmin });
  const allowTemplates = access.templates;
  const allowSend = access.send;

  if (!access.metaHub) {
    return null;
  }

  const overview = await getMetaHubOverview(workspace.id);
  const flags = getMetaHubFlags();
  const basePath = `/${workspace.slug}/meta-hub`;
  const planLabel = isDevOverride ? "DEV (Full Access)" : planInfo.displayName;

  const templateTotal =
    (overview.kpis.templates.approved ?? 0) +
    (overview.kpis.templates.pending ?? 0) +
    (overview.kpis.templates.rejected ?? 0);
  const templateStat =
    templateTotal > 0
      ? `${overview.kpis.templates.approved ?? 0} approved templates`
      : "No templates yet";
  const whatsappStatus: ChannelStatus = access.metaHub
    ? overview.health.whatsapp.connected
      ? "live"
      : "beta"
    : "locked";
  const instagramStatus: ChannelStatus = flags.igEnabled
    ? access.metaHub
      ? "beta"
      : "locked"
    : "soon";
  const messengerStatus: ChannelStatus = flags.msEnabled
    ? access.metaHub
      ? "beta"
      : "locked"
    : "soon";
  const adsStatus: ChannelStatus = flags.adsEnabled
    ? access.metaHub
      ? "beta"
      : "locked"
    : "soon";
  const insightsStatus: ChannelStatus = flags.insightsEnabled
    ? access.metaHub
      ? "beta"
      : "locked"
    : "soon";

  const channels = [
    {
      name: "WhatsApp",
      status: whatsappStatus,
      desc: "Template, inbox, scheduler.",
      stats: [
        overview.health.whatsapp.connected ? "Connected" : "Not connected",
        templateStat,
      ],
      href: `${basePath}/messaging/whatsapp`,
    },
    {
      name: "Instagram",
      status: instagramStatus,
      desc: "DM API and webhook events.",
      stats: ["Coming soon", "Notify me"],
      href: `${basePath}/messaging/instagram`,
    },
    {
      name: "Messenger",
      status: messengerStatus,
      desc: "Send/receive messages.",
      stats: ["Coming soon", "Notify me"],
      href: `${basePath}/messaging/messenger`,
    },
    {
      name: "Ads",
      status: adsStatus,
      desc: "Campaign management and audiences.",
      stats: ["Coming soon", "Notify me"],
      href: `${basePath}/ads`,
    },
    {
      name: "Insights",
      status: insightsStatus,
      desc: "Performance and alerts.",
      stats: ["Coming soon", "Notify me"],
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
