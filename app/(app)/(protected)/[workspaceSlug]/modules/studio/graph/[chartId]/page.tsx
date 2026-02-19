import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  ArrowLeft,
  Clock,
  Tag,
  Database,
  LineChart,
  PieChart,
  TrendingUp,
  Filter,
  Table,
  Grid3X3,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { ChartActions } from "@/components/studio/ChartActions";
import { ChartRenderer } from "@/components/studio/ChartRenderer";
import { ChartExportButton } from "@/components/studio/ChartExportButton";
import { GenerateButton } from "@/components/studio/GenerateButton";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import LockedScreen from "@/components/app/LockedScreen";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string; chartId: string }>;
};

const typeIcons: Record<string, typeof BarChart3> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  area: TrendingUp,
  funnel: Filter,
  table: Table,
  heatmap: Grid3X3,
};

const typeColors: Record<string, string> = {
  bar: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  line: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pie: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  area: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  scatter: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  radar: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  heatmap: "bg-red-500/10 text-red-400 border-red-500/20",
  funnel: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  table: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default async function ChartDetailPage({ params }: PageProps) {
  const { workspaceSlug, chartId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = await supabaseServer();
  const t = await getTranslations("studio");

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
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
      <LockedScreen title={t("graph.lockedTitle")} workspaceSlug={workspaceSlug} />
    );
  }

  const { data: chart, error } = await db
    .from("graph_charts")
    .select("*")
    .eq("id", chartId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .single();

  if (error || !chart) notFound();

  const basePath = `/${workspaceSlug}/modules/studio/graph`;
  const Icon = typeIcons[chart.chart_type] || BarChart3;
  const color = typeColors[chart.chart_type] || "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border-[#f5f5dc]/10";

  return (
    <div className="space-y-6">
      {/* Back + Meta */}
      <div className="flex items-center gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("graph.backToCharts")}
        </Link>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${color}`}>
          <Icon className="h-3 w-3" />
          {chart.chart_type}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{chart.title}</h1>
        {chart.description && (
          <p className="mt-1 text-sm text-[#f5f5dc]/50">{chart.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#f5f5dc]/30">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("common.updatedPrefix")} {new Date(chart.updated_at).toLocaleString()}
          </span>
          {chart.data_source && (
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              {t("graph.sourcePrefix")} {chart.data_source}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {chart.tags && chart.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chart.tags.map((tag: string) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] text-purple-400">
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Chart Visualization */}
      <div className="space-y-4">
        {chart.data_json?.labels && chart.data_json?.datasets ? (
          <>
            <div className="flex items-center justify-end">
              <ChartExportButton filename={chart.title} />
            </div>
            <ChartRenderer
            chartType={chart.chart_type}
            dataJson={chart.data_json as { labels: string[]; datasets: Array<{ label: string; data: number[]; backgroundColor?: string | string[]; borderColor?: string }> }}
            configJson={chart.config_json as { title?: string; x_axis?: string; y_axis?: string; show_legend?: boolean; show_grid?: boolean } | null}
            height={380}
          />
          </>
        ) : (
          <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
            <div className="py-8 text-center">
              <Icon className="mx-auto mb-3 h-12 w-12 text-purple-400/20" />
              <p className="text-sm text-[#f5f5dc]/40 mb-4">
                {t("graph.detail.configHint")}
              </p>
              <GenerateButton
                type="chart"
                entityId={chartId}
                prompt={chart.description || chart.title}
                hasPrompt={Boolean(chart.description || chart.title)}
                meta={{ chart_type: chart.chart_type }}
                label={t("common.generateWithAI")}
              />
            </div>
          </div>
        )}

        {/* Chart Config Info */}
        {(chart.config_json || chart.data_json) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {chart.chart_type && (
              <div className="rounded-lg bg-[#0a1229]/60 px-4 py-3">
                <p className="text-[10px] text-[#f5f5dc]/30 uppercase tracking-wider mb-1">{t("graph.detail.type")}</p>
                <p className="text-sm text-[#f5f5dc]/70 capitalize">{chart.chart_type}</p>
              </div>
            )}
            {chart.data_source && (
              <div className="rounded-lg bg-[#0a1229]/60 px-4 py-3">
                <p className="text-[10px] text-[#f5f5dc]/30 uppercase tracking-wider mb-1">{t("graph.sourcePrefix")}</p>
                <p className="text-sm text-[#f5f5dc]/70 capitalize">{chart.data_source}</p>
              </div>
            )}
          </div>
        )}

        {/* Regenerate button for existing charts with data */}
        {chart.data_json?.labels && (
          <GenerateButton
            type="chart"
            entityId={chartId}
            prompt={chart.description || chart.title}
            hasPrompt={Boolean(chart.description || chart.title)}
            meta={{ chart_type: chart.chart_type }}
            label={t("common.regenerate")}
          />
        )}
      </div>

      {/* Actions */}
      <ChartActions
        chartId={chartId}
        workspaceSlug={workspaceSlug}
        title={chart.title}
        description={chart.description ?? ""}
      />
    </div>
  );
}
