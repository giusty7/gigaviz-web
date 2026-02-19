"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = { params: Promise<{ workspaceSlug: string }> };

const CHART_TYPES = [
  { key: "bar", label: "Bar Chart", icon: BarChart3, color: "blue" },
  { key: "line", label: "Line Chart", icon: LineChart, color: "emerald" },
  { key: "pie", label: "Pie Chart", icon: PieChart, color: "purple" },
  { key: "area", label: "Area Chart", icon: TrendingUp, color: "amber" },
  { key: "scatter", label: "Scatter Plot", icon: BarChart3, color: "pink" },
  { key: "radar", label: "Radar Chart", icon: BarChart3, color: "cyan" },
] as const;

const DATA_SOURCES = [
  { key: "manual", label: "Manual Entry" },
  { key: "csv", label: "CSV Upload" },
  { key: "api", label: "API Endpoint" },
  { key: "database", label: "Database Query" },
] as const;

export default function NewChartPage({ params: _params }: Props) {
  const router = useRouter();
  const t = useTranslations("studio");
  const [chartType, setChartType] = useState("bar");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [dataSource, setDataSource] = useState("manual");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && tags.length < 10 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTag("");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/studio/graph/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          chart_type: chartType,
          data_source: dataSource,
          prompt: prompt.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        const { workspaceSlug } = await _params;
        const detailUrl = `/${workspaceSlug}/modules/studio/graph/${data.id}`;

        // Auto-trigger AI generation if prompt was provided
        if (prompt.trim()) {
          fetch("/api/studio/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "chart",
              entityId: data.id,
              prompt: prompt.trim(),
              chart_type: chartType,
            }),
          }).catch(() => {}); // Fire-and-forget
        }

        router.push(detailUrl);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to create chart (${res.status})`);
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setCreating(false);
    }
  };

  const colorMap: Record<string, { base: string; selected: string; text: string }> = {
    blue: { base: "border-blue-500/20 bg-blue-500/10", selected: "border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/30", text: "text-blue-400" },
    emerald: { base: "border-emerald-500/20 bg-emerald-500/10", selected: "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/30", text: "text-emerald-400" },
    purple: { base: "border-purple-500/20 bg-purple-500/10", selected: "border-purple-400 bg-purple-500/20 ring-1 ring-purple-400/30", text: "text-purple-400" },
    amber: { base: "border-amber-500/20 bg-amber-500/10", selected: "border-amber-400 bg-amber-500/20 ring-1 ring-amber-400/30", text: "text-amber-400" },
    pink: { base: "border-pink-500/20 bg-pink-500/10", selected: "border-pink-400 bg-pink-500/20 ring-1 ring-pink-400/30", text: "text-pink-400" },
    cyan: { base: "border-cyan-500/20 bg-cyan-500/10", selected: "border-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-400/30", text: "text-cyan-400" },
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{t("graph.new.title")}</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/50">
          {t("graph.new.description")}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Chart Type Selector */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("graph.new.chartTypeLabel")}
        </label>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {CHART_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = chartType === type.key;
            const c = colorMap[type.color];
            return (
              <button
                key={type.key}
                onClick={() => setChartType(type.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                  isSelected ? c.selected : "border-[#f5f5dc]/10 bg-[#0a1229]/40 hover:border-[#f5f5dc]/20"
                )}
              >
                <Icon className={cn("h-6 w-6", isSelected ? c.text : "text-[#f5f5dc]/40")} />
                <span className={cn("text-xs font-semibold", isSelected ? "text-[#f5f5dc]" : "text-[#f5f5dc]/60")}>
                  {t(`graph.new.chartTypes.${type.key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("common.titleLabel")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("graph.new.titlePlaceholder")}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("common.descriptionOptionalLabel")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("graph.new.descriptionPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none"
        />
      </div>

      {/* AI Prompt */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-purple-400" />
          {t("common.generateWithAI")}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("graph.new.aiPromptPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none"
        />
        <p className="mt-1 text-[10px] text-[#f5f5dc]/25">
          {t("graph.new.aiPromptHint")}
        </p>
      </div>

      {/* Data Source */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("graph.new.dataSourceLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {DATA_SOURCES.map((ds) => (
            <button
              key={ds.key}
              onClick={() => setDataSource(ds.key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                dataSource === ds.key
                  ? "border-purple-400 bg-purple-500/20 text-purple-300"
                  : "border-[#f5f5dc]/10 bg-[#0a1229]/40 text-[#f5f5dc]/50 hover:border-[#f5f5dc]/20"
              )}
            >
              {t(`graph.new.dataSources.${ds.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("common.tagsOptionalLabel")}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder={t("common.tagPlaceholder")}
            className="flex-1 rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
          <button onClick={addTag} className="rounded-lg border border-[#f5f5dc]/10 px-3 py-2 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]">
            {t("common.addButton")}
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tagItem) => (
              <span key={tagItem} className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                {tagItem}
                <button onClick={() => setTags(tags.filter((x) => x !== tagItem))} className="hover:text-red-400">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!title.trim() || creating}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-purple-600 px-6 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.creating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {t("graph.new.createButton")}
          </>
        )}
      </button>
    </div>
  );
}
