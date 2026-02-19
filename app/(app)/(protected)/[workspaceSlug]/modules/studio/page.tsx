import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  BarChart3,
  Workflow,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Bot,
  Zap,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  Plus,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { canAccess, getPlanMeta, type FeatureKey } from "@/lib/entitlements";
import { PageHeader } from "@/components/ui/page-header";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function StudioHubPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = await supabaseServer();

  // Fetch stats in parallel
  const [docsResult, chartsResult, workflowsResult, imagesResult, videosResult, musicResult, dashboardsResult, runsResult, templatesResult, subResult] = await Promise.all([
    db
      .from("office_documents")
      .select("id, title, category, updated_at", { count: "exact" })
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    db
      .from("graph_charts")
      .select("id, title, chart_type, updated_at", { count: "exact" })
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    db
      .from("tracks_workflows")
      .select("id, title, status, updated_at", { count: "exact" })
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    db
      .from("graph_images")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    db
      .from("graph_videos")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    db
      .from("tracks_music")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    db
      .from("graph_dashboards")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    db
      .from("tracks_runs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    db
      .from("office_templates")
      .select("id", { count: "exact", head: true })
      .or(`workspace_id.eq.${workspace.id},is_public.eq.true`),
    db
      .from("subscriptions")
      .select("plan_id")
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  const plan = getPlanMeta(subResult.data?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const ents = ctx.effectiveEntitlements ?? [];
  const check = (f: FeatureKey) =>
    canAccess({ plan_id: plan.plan_id, is_admin: isAdmin, effectiveEntitlements: ents }, f);

  const t = await getTranslations("studio");
  const basePath = `/${workspaceSlug}/modules/studio`;

  const templateCount = templatesResult.count ?? 0;
  const totalAssets = (docsResult.count ?? 0) + (chartsResult.count ?? 0) + (workflowsResult.count ?? 0) +
    (imagesResult.count ?? 0) + (videosResult.count ?? 0) + (musicResult.count ?? 0) +
    (dashboardsResult.count ?? 0) + templateCount;

  const modules = [
    {
      key: "office",
      name: t("hub.modules.office.name"),
      description: t("hub.modules.office.description"),
      icon: FileText,
      color: "blue",
      href: `${basePath}/office`,
      stat: docsResult.count ?? 0,
      statLabel: t("hub.modules.office.statLabel"),
      unlocked: check("office"),
      features: t.raw("hub.modules.office.features") as string[],
    },
    {
      key: "graph",
      name: t("hub.modules.graph.name"),
      description: t("hub.modules.graph.description"),
      icon: BarChart3,
      color: "purple",
      href: `${basePath}/graph`,
      stat: (chartsResult.count ?? 0) + (imagesResult.count ?? 0) + (videosResult.count ?? 0) + (dashboardsResult.count ?? 0),
      statLabel: t("hub.modules.graph.statLabel"),
      unlocked: check("graph"),
      features: t.raw("hub.modules.graph.features") as string[],
    },
    {
      key: "tracks",
      name: t("hub.modules.tracks.name"),
      description: t("hub.modules.tracks.description"),
      icon: Workflow,
      color: "teal",
      href: `${basePath}/tracks`,
      stat: (workflowsResult.count ?? 0) + (musicResult.count ?? 0),
      statLabel: t("hub.modules.tracks.statLabel"),
      unlocked: check("tracks"),
      features: t.raw("hub.modules.tracks.features") as string[],
    },
  ] as const;

  const colorMap = {
    blue: { bg: "from-blue-500/20 to-blue-400/5", border: "border-blue-500/20", text: "text-blue-400", badge: "bg-blue-500/15 text-blue-400", hover: "hover:shadow-blue-500/5" },
    purple: { bg: "from-purple-500/20 to-purple-400/5", border: "border-purple-500/20", text: "text-purple-400", badge: "bg-purple-500/15 text-purple-400", hover: "hover:shadow-purple-500/5" },
    teal: { bg: "from-teal-500/20 to-teal-400/5", border: "border-teal-500/20", text: "text-teal-400", badge: "bg-teal-500/15 text-teal-400", hover: "hover:shadow-teal-500/5" },
  } as const;

  // Quick action buttons
  const quickActions = [
    { label: t("hub.quickActions.newDoc"), icon: FileText, href: `${basePath}/office/new`, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { label: t("hub.quickActions.newChart"), icon: BarChart3, href: `${basePath}/graph/new`, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { label: t("hub.quickActions.newImage"), icon: ImageIcon, href: `${basePath}/graph/images/new`, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
    { label: t("hub.quickActions.newVideo"), icon: VideoIcon, href: `${basePath}/graph/videos/new`, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { label: t("hub.quickActions.newWorkflow"), icon: Workflow, href: `${basePath}/tracks/new`, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
    { label: t("hub.quickActions.newMusic"), icon: MusicIcon, href: `${basePath}/tracks/music/new`, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  ];

  // Collect recent items
  const recentItems = [
    ...(docsResult.data ?? []).map((d) => ({ id: d.id, title: d.title, type: "document" as const, icon: FileText, href: `${basePath}/office/${d.id}`, updated: d.updated_at, color: "text-blue-400" })),
    ...(chartsResult.data ?? []).map((c) => ({ id: c.id, title: c.title, type: "chart" as const, icon: BarChart3, href: `${basePath}/graph/${c.id}`, updated: c.updated_at, color: "text-purple-400" })),
    ...(workflowsResult.data ?? []).map((w) => ({ id: w.id, title: w.title, type: "workflow" as const, icon: Workflow, href: `${basePath}/tracks/${w.id}`, updated: w.updated_at, color: "text-teal-400" })),
  ].sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()).slice(0, 8);

  const integrations = [
    {
      icon: MessageSquare,
      title: t("hub.integrations.metaHub.title"),
      description: t("hub.integrations.metaHub.description"),
      href: `/${workspaceSlug}/meta-hub`,
      color: "text-amber-400",
    },
    {
      icon: Bot,
      title: t("hub.integrations.helperAi.title"),
      description: t("hub.integrations.helperAi.description"),
      href: `/${workspaceSlug}/helper`,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <PageHeader
        title={t("hub.title")}
        description={t("hub.description")}
        badge={
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              {t("hub.badge")}
            </span>
          </div>
        }
      />

      {/* Overall Stats Bar */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-cyan-500/20 bg-[#0a1229]/60 p-4">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">{totalAssets}</p>
              <p className="text-[10px] text-[#f5f5dc]/40">{t("hub.stats.totalAssets")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-[#0a1229]/60 p-4">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">{docsResult.count ?? 0}</p>
              <p className="text-[10px] text-[#f5f5dc]/40">{t("hub.stats.documents")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-[#0a1229]/60 p-4">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="h-5 w-5 text-purple-400" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">{(imagesResult.count ?? 0) + (chartsResult.count ?? 0)}</p>
              <p className="text-[10px] text-[#f5f5dc]/40">{t("hub.stats.visuals")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-teal-500/20 bg-[#0a1229]/60 p-4">
          <div className="flex items-center gap-2.5">
            <Zap className="h-5 w-5 text-teal-400" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">{runsResult.count ?? 0}</p>
              <p className="text-[10px] text-[#f5f5dc]/40">{t("hub.stats.automations")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Plus className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          {t("hub.quickActions.title")}
        </h2>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:scale-[1.02] hover:shadow-lg ${action.color}`}
              >
                <ActionIcon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-semibold leading-tight">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {modules.map((mod) => {
          const c = colorMap[mod.color];
          const Icon = mod.icon;
          return (
            <div
              key={mod.key}
              className={`group relative rounded-2xl border ${c.border} bg-gigaviz-surface/60 p-6 transition-all duration-300 hover:shadow-lg ${c.hover}`}
            >
              {/* Icon + Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.bg}`}>
                  <Icon className={`h-6 w-6 ${c.text}`} aria-hidden="true" />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    mod.unlocked
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {mod.unlocked ? t("common.unlocked") : t("common.locked")}
                </span>
              </div>

              {/* Name + Description */}
              <h3 className="text-lg font-semibold text-foreground mb-2">{mod.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{mod.description}</p>

              {/* Features */}
              <div className="space-y-1 mb-5">
                {mod.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <Zap className="h-3 w-3 text-cyan-500/60" aria-hidden="true" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Stat + CTA */}
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-bold ${c.text}`}>{mod.stat}</p>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{mod.statLabel}</p>
                </div>
                {mod.unlocked ? (
                  <Link
                    href={mod.href}
                    className={`inline-flex items-center gap-1.5 rounded-lg border ${c.border} px-3 py-1.5 text-xs font-semibold ${c.text} transition-colors hover:bg-foreground/5`}
                  >
                    {t("hub.openButton")} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    href={`/${workspaceSlug}/billing`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/10"
                  >
                    {t("hub.upgradeButton")}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      {recentItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            {t("hub.recentActivity.title")}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-3.5 transition-all hover:border-cyan-500/20 hover:bg-[#0a1229]/60"
                >
                  <ItemIcon className={`h-4 w-4 shrink-0 ${item.color}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#f5f5dc] group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[#f5f5dc]/30">
                      {new Date(item.updated).toLocaleDateString()} · {item.type}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 shrink-0 text-[#f5f5dc]/15 group-hover:text-cyan-400 transition-colors" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Integrations Section */}
      <div>
        <h2 className="text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          {t("hub.integrations.title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((int) => {
            const IntIcon = int.icon;
            return (
              <Link
                key={int.title}
                href={int.href}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-gigaviz-surface/40 p-5 transition-all hover:border-cyan-500/20 hover:bg-gigaviz-surface/60"
              >
                <div className="mt-0.5">
                  <IntIcon className={`h-5 w-5 ${int.color}`} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-cyan-300 transition-colors">
                    {int.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground/60 leading-relaxed">
                    {int.description}
                  </p>
                </div>
                <ArrowRight className="ml-auto mt-0.5 h-4 w-4 text-muted-foreground/30 group-hover:text-cyan-400 transition-colors" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
