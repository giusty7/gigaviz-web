import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Plus,
  PieChart,
  LineChart,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

const chartTypeIcons: Record<string, typeof BarChart3> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  area: TrendingUp,
};

const chartTypeColors: Record<string, string> = {
  bar: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  line: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pie: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  area: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  scatter: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  radar: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  heatmap: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function GraphChartsPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = supabaseAdmin();

  // Entitlement check
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const plan = getPlanMeta(sub?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const ents = ctx.effectiveEntitlements ?? [];
  const hasAccess = canAccess(
    { plan_id: plan.plan_id, is_admin: isAdmin, effectiveEntitlements: ents },
    "graph"
  );

  if (!hasAccess) {
    return (
      <LockedScreen
        title="Gigaviz Graph is locked"
        description="Upgrade to Growth plan or above to create AI-powered charts, dashboards, and visuals."
        workspaceSlug={workspaceSlug}
      />
    );
  }

  // Fetch data in parallel
  const [chartsResult, dashboardsResult] = await Promise.all([
    db
      .from("graph_charts")
      .select("id, title, chart_type, tags, data_source, updated_at")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(20),
    db
      .from("graph_dashboards")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
  ]);

  const charts = chartsResult.data ?? [];
  const dashboardCount = dashboardsResult.count ?? 0;
  const basePath = `/${workspaceSlug}/modules/studio/graph`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5dc]">Charts & Visualizations</h1>
          <p className="mt-1 text-sm text-[#f5f5dc]/50">
            Create charts, dashboards, and data visualizations. Connected to your workspace data.
          </p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-500"
        >
          <Plus className="h-4 w-4" />
          New Chart
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">{charts.length}</p>
              <p className="text-xs text-[#f5f5dc]/40">Charts</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">{dashboardCount}</p>
              <p className="text-xs text-[#f5f5dc]/40">Dashboards</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">
                {[...new Set(charts.map((c) => c.chart_type))].length}
              </p>
              <p className="text-xs text-[#f5f5dc]/40">Chart Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider">
          Your Charts
        </h2>
        {charts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {charts.map((chart) => {
              const Icon = chartTypeIcons[chart.chart_type] || BarChart3;
              const color = chartTypeColors[chart.chart_type] || "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border-[#f5f5dc]/10";
              return (
                <Link
                  key={chart.id}
                  href={`${basePath}/charts/${chart.id}`}
                  className="group rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5 transition-all hover:border-purple-500/20 hover:bg-[#0a1229]/60"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-[#f5f5dc]/5 px-2 py-0.5 text-[10px] text-[#f5f5dc]/30 capitalize">
                      {chart.chart_type}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#f5f5dc] mb-1 group-hover:text-purple-300 transition-colors">
                    {chart.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(chart.tags ?? []).slice(0, 3).map((tag: string) => (
                      <span key={tag} className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#f5f5dc]/25">
                    {chart.data_source && `Source: ${chart.data_source} · `}
                    Updated {new Date(chart.updated_at).toLocaleDateString()}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 text-center">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
            <p className="text-sm font-medium text-[#f5f5dc]/40">No charts yet</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/25">
              Create your first chart from workspace data or AI generation.
            </p>
            <Link
              href={`${basePath}/new`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600/80 px-4 py-2 text-xs font-medium text-white hover:bg-purple-500"
            >
              <Plus className="h-3 w-3" /> Create Chart
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
