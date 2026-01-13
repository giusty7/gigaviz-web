import Link from "next/link";
import { redirect } from "next/navigation";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import PreviewBanner from "@/components/modules/preview-banner";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { ActionGate } from "@/components/gates/action-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { getMetaHubOverview } from "@/lib/meta/overview-data";
import { formatRelativeTime } from "@/lib/time";
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

  const connectors = [
    {
      name: "WhatsApp",
      status: flags.waEnabled ? "live" : "beta",
      desc: "Template, inbox, scheduler.",
      stats: [
        overview.health.whatsapp.connected ? "Connected" : "Not connected",
        `${overview.kpis.templates.approved ?? "—"} approved templates`,
      ],
      href: `${basePath}/messaging/whatsapp`,
    },
    {
      name: "Instagram",
      status: flags.igEnabled ? "beta" : "soon",
      desc: "DM API, webhook events.",
      stats: ["Preview", "DM & mention"],
      href: `${basePath}/messaging/instagram`,
    },
    {
      name: "Messenger",
      status: flags.msEnabled ? "beta" : "soon",
      desc: "Send/receive messages.",
      stats: ["Preview", "Inbox"],
      href: `${basePath}/messaging/messenger`,
    },
    {
      name: "Ads",
      status: flags.adsEnabled ? "beta" : "soon",
      desc: "Campaign management & audiences.",
      stats: ["Preview", "Campaigns"],
      href: `${basePath}/ads`,
    },
    {
      name: "Insights",
      status: flags.insightsEnabled ? "beta" : "soon",
      desc: "Performance and alerts.",
      stats: ["Preview", "Analytics"],
      href: `${basePath}/insights`,
    },
  ] as const;

  const alerts = overview.alerts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Meta Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Integration status for Meta. WhatsApp is live; other connectors are coming soon.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-gigaviz-gold text-gigaviz-gold">
            Plan: {planLabel}
          </Badge>
          {!isDevOverride && <UpgradeButton variant="outline" size="sm" />}
        </div>
      </div>

      {isPreview && <PreviewBanner />}

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Integration Health</CardTitle>
          <CardDescription>Monitor WhatsApp connections and webhooks.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">WhatsApp</p>
              <MetaHubBadge status={overview.health.whatsapp.connected ? "live" : "beta"} />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="WABA ID" value={overview.health.whatsapp.wabaIdMasked} />
              <Row label="Phone Number ID" value={overview.health.whatsapp.phoneIdMasked} />
              <Row
                label="Token"
                value={overview.health.whatsapp.tokenConfigured ? "Configured" : "Missing"}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`${basePath}/connections`}>Open Connections</Link>
              </Button>
              <ActionGate allowed={allowSend}>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`${basePath}/messaging/whatsapp`}>Open WhatsApp Hub</Link>
                </Button>
              </ActionGate>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Webhook</p>
              <MetaHubBadge
                status={
                  overview.health.webhook.status === "ok"
                    ? "live"
                    : overview.health.webhook.status === "stale"
                      ? "beta"
                      : "soon"
                }
              />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <Row
                label="Last event"
                value={
                  overview.health.webhook.lastEventAt
                    ? formatRelativeTime(overview.health.webhook.lastEventAt)
                    : "No events yet"
                }
              />
              <Row
                label="Events (24h)"
                value={
                  overview.health.webhook.events24h !== null
                    ? overview.health.webhook.events24h.toString()
                    : "—"
                }
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`${basePath}/webhooks`}>View Webhook Events</Link>
              </Button>
              <Button size="sm" variant="ghost">
                How to Verify
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Inbound (24h)"
          value={formatCount(overview.kpis.inboundCount24h)}
          helper="Incoming messages"
        />
        <KpiCard
          title="Outbound (24h)"
          value={formatCount(overview.kpis.outboundCount24h)}
          helper="Outgoing messages"
        />
        <KpiCard
          title="Webhook events (24h)"
          value={formatCount(overview.kpis.totalEvents24h)}
          helper="Events received"
        />
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Templates</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Approved / Pending / Rejected
            </CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {overview.kpis.templates.approved === null ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              <div className="flex items-baseline gap-2">
                <span>{overview.kpis.templates.approved}</span>
                <span className="text-sm text-muted-foreground">
                  / {overview.kpis.templates.pending} / {overview.kpis.templates.rejected}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common shortcuts.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <ActionGate allowed={allowTemplates}>
            <Button asChild variant="outline" className="justify-between">
              <Link href={`${basePath}/messaging/whatsapp`}>Sync Templates</Link>
            </Button>
          </ActionGate>
          <Button asChild variant="outline" className="justify-between">
                <Link href={`${basePath}/messaging/whatsapp/inbox`}>Open Inbox</Link>
          </Button>
          <ActionGate allowed={allowSend}>
            <Button asChild variant="outline" className="justify-between">
                  <Link href={`${basePath}/messaging/whatsapp`}>Test Send Template</Link>
            </Button>
          </ActionGate>
          <Button asChild variant="outline" className="justify-between">
            <Link href={`${basePath}/connections`}>Edit Connection Settings</Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start">
                <Link href={`${basePath}/webhooks`}>View Events</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Needs Attention</CardTitle>
          <CardDescription>Automated alerts for next steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {alerts.length === 0 ? (
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="font-semibold">Everything looks normal.</p>
              <p className="text-muted-foreground text-xs">
                No issues detected right now.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.title}
                className="flex items-start justify-between rounded-xl border border-border bg-background px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  {alert.description ? (
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  ) : null}
                </div>
                {alert.actionHref && (
                  <Button asChild size="sm" variant="outline" className="ml-3 shrink-0">
                    <Link href={`${basePath}/${alert.actionHref}`}>
                      {alert.actionLabel ?? "Open"}
                    </Link>
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Latest Webhooks</CardTitle>
            <CardDescription>Most recent events received.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {overview.recentEvents.length === 0 ? (
              <EmptyState message="No data yet. Make sure the webhook is installed, then send a test message." />
            ) : (
              overview.recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{evt.type || "Event"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(evt.receivedAt)}
                    </p>
                  </div>
                  <span aria-hidden className="h-2 w-2 rounded-full bg-gigaviz-gold" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Latest Conversations</CardTitle>
            <CardDescription>Inbox preview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {overview.recentConversations.length === 0 ? (
              <EmptyState message="No conversations yet. Click Refresh Inbox after receiving webhooks." />
            ) : (
              overview.recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`${basePath}/messaging/whatsapp/inbox`}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-gigaviz-gold"
                >
                  <div>
                    <p className="font-semibold">{conv.contact}</p>
                    <p className="text-xs text-muted-foreground">{conv.preview}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(conv.time)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>All Meta Hub channels.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {connectors.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="rounded-xl border border-border bg-background p-4 hover:border-gigaviz-gold"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">{c.name}</p>
                <MetaHubBadge status={c.status as "live" | "beta" | "soon"} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.stats.join(" • ")}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function KpiCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{helper}</CardDescription>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        <span>{value}</span>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function formatCount(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toString();
}

