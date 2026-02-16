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
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { ChartActions } from "@/components/studio/ChartActions";
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
};

const typeColors: Record<string, string> = {
  bar: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  line: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pie: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  area: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  scatter: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  radar: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  heatmap: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function ChartDetailPage({ params }: PageProps) {
  const { workspaceSlug, chartId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = await supabaseServer();
  const { data: chart, error } = await db
    .from("graph_charts")
    .select("*")
    .eq("id", chartId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .single();

  if (error || !chart) notFound();

  const t = await getTranslations("studio");
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

      {/* Chart Preview Area */}
      <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
        {chart.config_json || chart.data_json ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#f5f5dc]/60">{t("graph.detail.configTitle")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {chart.chart_type && (
                <div className="rounded-lg bg-[#0a1229]/60 px-4 py-3">
                  <p className="text-[10px] text-[#f5f5dc]/30 uppercase tracking-wider mb-1">Type</p>
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
            <div className="rounded-lg border border-dashed border-purple-500/20 bg-[#0a1229]/30 p-8 text-center">
              <Icon className="mx-auto mb-2 h-10 w-10 text-purple-400/30" />
              <p className="text-xs text-[#f5f5dc]/30">{t("graph.detail.configHint")}</p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Icon className="mx-auto mb-3 h-12 w-12 text-purple-400/20" />
            <p className="text-sm text-[#f5f5dc]/40">
              {t("graph.detail.configHint")}
            </p>
          </div>
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
