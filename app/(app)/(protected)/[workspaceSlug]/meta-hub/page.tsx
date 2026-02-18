import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ImperiumMetaHubOverviewClient } from "@/components/meta-hub/ImperiumMetaHubOverviewClient";
import { MetaHubStatusCard } from "@/components/meta-hub/MetaHubStatusCard";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { getMetaHubAccess } from "@/lib/meta-hub/access";
import { getMetaHubOverview } from "@/lib/meta/overview-data";
import { getMetaHubStatus } from "@/lib/meta-hub/getMetaHubStatus";
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
  const access = getMetaHubAccess({ 
    planId: planInfo.planId, 
    isAdmin,
    effectiveEntitlements: ctx.effectiveEntitlements,
  });
  const allowTemplates = access.templates;
  const allowSend = access.send;
  const allowWebhooks = access.webhooks;

  if (!access.metaHub) {
    return null;
  }

  // Fetch real-time integration status
  const integrationStatus = await getMetaHubStatus(workspace.id);

  const t = await getTranslations("metaHub");
  const overview = await getMetaHubOverview(workspace.id);
  const flags = getMetaHubFlags();
  const basePath = `/${workspace.slug}/meta-hub`;
  const planLabel = isDevOverride ? t("devFullAccess") : planInfo.displayName;

  const templateTotal =
    (overview.kpis.templates.approved ?? 0) +
    (overview.kpis.templates.pending ?? 0) +
    (overview.kpis.templates.rejected ?? 0);
  const templateStat =
    templateTotal > 0
      ? t("approvedTemplates", { count: overview.kpis.templates.approved ?? 0 })
      : t("noTemplatesYet");
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
      name: t("channelWhatsApp"),
      status: whatsappStatus,
      desc: t("channelWhatsAppDesc"),
      stats: [
        overview.health.whatsapp.connected ? t("statusConnected") : t("statusNotConnected"),
        templateStat,
      ],
      href: `${basePath}/messaging/whatsapp`,
    },
    {
      name: t("channelInstagram"),
      status: instagramStatus,
      desc: t("channelInstagramDesc"),
      stats: instagramStatus === "beta"
        ? [t("statusReadyToConnect"), t("statusDirectMessages")]
        : [t("statusComingSoon"), t("statusNotifyMe")],
      href: `${basePath}/messaging/instagram`,
    },
    {
      name: t("channelMessenger"),
      status: messengerStatus,
      desc: t("channelMessengerDesc"),
      stats: messengerStatus === "beta"
        ? [t("statusReadyToConnect"), t("statusPageMessaging")]
        : [t("statusComingSoon"), t("statusNotifyMe")],
      href: `${basePath}/messaging/messenger`,
    },
    {
      name: t("channelAds"),
      status: adsStatus,
      desc: t("channelAdsDesc"),
      stats: [t("statusComingSoon"), t("statusNotifyMe")],
      href: `${basePath}/ads`,
    },
    {
      name: t("channelInsights"),
      status: insightsStatus,
      desc: t("channelInsightsDesc"),
      stats: insightsStatus === "beta"
        ? [t("statusAvailable"), t("statusAnalytics")]
        : [t("statusComingSoon"), t("statusNotifyMe")],
      href: `${basePath}/insights`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Integration Status Card */}
      <MetaHubStatusCard
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        initialStatus={integrationStatus}
      />

      {/* Existing Overview Client */}
      <ImperiumMetaHubOverviewClient
        basePath={basePath}
        planLabel={planLabel}
        isDevOverride={isDevOverride}
        isPreview={isPreview}
        allowTemplates={allowTemplates}
        allowSend={allowSend}
        allowWebhooks={allowWebhooks}
        health={overview.health}
        kpis={overview.kpis}
        alerts={overview.alerts}
        recentEvents={overview.recentEvents}
        recentConversations={overview.recentConversations}
        channels={channels}
      />
    </div>
  );
}
