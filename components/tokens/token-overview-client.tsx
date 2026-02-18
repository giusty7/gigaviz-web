"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import type { TokenOverview, TokenSettings } from "@/lib/tokens";

type OverviewResponse = {
  overview: TokenOverview;
  settings: TokenSettings;
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  showExtraCopy?: boolean;
};

type MonthOption = { value: string; label: string };

function buildMonthOptions(): MonthOption[] {
  const now = new Date();
  const options: MonthOption[] = [];
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

function statusBadge(status: TokenOverview["status"]) {
  if (status === "critical") return { label: "Critical", className: "bg-red-500/20 text-red-200 border-red-400/50" };
  if (status === "warning") return { label: "Warning", className: "bg-amber-400/20 text-amber-100 border-amber-400/50" };
  return { label: "Healthy", className: "bg-emerald-400/15 text-emerald-100 border-emerald-400/50" };
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

function padBars(daily: Array<{ day: string; tokens: number }>) {
  if (daily.length > 0) return daily;
  const today = new Date();
  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (6 - idx)));
    const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    return { day: label, tokens: 0 };
  });
}

export function TokenOverviewClient({ workspaceId, workspaceSlug, showExtraCopy = false }: Props) {
  const t = useTranslations("tokensUI.overview");
  const { toast } = useToast();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<string>(() => buildMonthOptions()[0]?.value ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const options = useMemo(() => buildMonthOptions(), []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens/overview?workspaceId=${workspaceId}&month=${month}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.overview) {
        throw new Error(json?.error || "Failed to load tokens overview");
      }
      setData(json as OverviewResponse);
    } catch (err) {
      toast({
        title: t("unableToLoadTokens"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, month]);

  const overview = data?.overview;
  const settings = data?.settings;
  const capLabel = overview?.cap === null ? t("unlimited") : formatNumber(overview?.cap);
  const remainingLabel = overview?.cap === null ? t("unlimited") : formatNumber(overview?.remaining ?? 0);
  const badge = statusBadge(overview?.status ?? "normal");

  const spark = useMemo(() => {
    const padded = padBars(overview?.dailyUsage ?? []);
    const sorted = [...padded].sort((a, b) => a.day.localeCompare(b.day));
    const max = Math.max(...sorted.map((d) => d.tokens), 1);
    return { sorted, max };
  }, [overview?.dailyUsage]);

  const progressWidth = (() => {
    if (overview?.percentUsed === null || overview?.percentUsed === undefined) return "0%";
    return `${Math.min(100, Math.max(0, overview.percentUsed)).toFixed(1)}%`;
  })();

  const progressColor = (() => {
    if (overview?.status === "critical") return "bg-red-500";
    if (overview?.status === "warning") return "bg-amber-400";
    return "bg-gigaviz-gold";
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-gigaviz-gold">{t("sectionLabel")}</p>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{t("title")}</h2>
            {overview ? <Badge className={`border ${badge.className}`}>{badge.label}</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Workspace {workspaceSlug} · {overview?.yyyymm ?? ""}
          </p>
          {showExtraCopy ? (
            <p className="text-xs text-muted-foreground">
              {t("extraCopy")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-border/60 bg-gigaviz-surface/70 px-3 py-2 text-xs text-muted-foreground">
            Alert at {settings?.alert_threshold ?? 80}%
          </div>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            title="Select month for token usage"
            className="rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground shadow-inner"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setRefreshing(true);
              load();
            }}
            disabled={refreshing}
            className="ml-1"
          >
            <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm shadow-black/10">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("cap")}</p>
            <Badge variant="outline" className="border-gigaviz-gold/60 text-gigaviz-gold">{capLabel}</Badge>
          </div>
          <p className="mt-2 text-lg font-semibold text-foreground">{capLabel}</p>
          {overview?.cap === null ? (
            <p className="text-xs text-muted-foreground">{t("unlimitedThisMonth")}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm shadow-black/10">
          <p className="text-xs text-muted-foreground">{t("used")}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{loading ? "…" : formatNumber(overview?.used)}</p>
          <p className="text-xs text-muted-foreground">{t("thisMonth")}</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm shadow-black/10">
          <p className="text-xs text-muted-foreground">{t("remaining")}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{remainingLabel}</p>
          {overview?.cap !== null ? (
            <p className="text-xs text-muted-foreground">
              {overview?.percentUsed !== null && overview?.percentUsed !== undefined
                ? t("percentUsed", { percent: Math.round(overview.percentUsed) })
                : ""}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm shadow-black/10">
          <p className="text-xs text-muted-foreground">{t("walletBalance")}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {loading ? "…" : formatNumber(overview?.balance)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Link href={`/${workspaceSlug}/tokens/wallet`} className="inline-flex items-center gap-1 text-gigaviz-gold hover:text-gigaviz-gold/80">
              {t("topUp")}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link href={`/${workspaceSlug}/tokens/ledger`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              {t("viewLedger")}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm shadow-black/10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{t("progress")}</p>
            <p className="text-sm text-muted-foreground">{t("alertAt", { threshold: settings?.alert_threshold ?? 80 })}</p>
          </div>
          <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gigaviz-surface">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: progressWidth }}
          />
          {overview?.status === "critical" ? (
            <div className="absolute inset-0 flex items-center justify-end pr-2 text-[11px] font-semibold text-red-100">
              {t("capExceeded")}
            </div>
          ) : null}
        </div>
        {overview?.status && overview.status !== "normal" ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            {overview?.status === "critical"
              ? t("criticalWarning")
              : t("approachingWarning")}
          </div>
        ) : null}

        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("dailyUsage")}</span>
            <span className="text-[11px] text-muted-foreground/80">{t("sparkline")}</span>
          </div>
          <div className="flex items-end gap-1 rounded-xl border border-border/70 bg-gigaviz-surface/60 p-3">
            {spark.sorted.map((item) => {
              const heightPct = Math.max(6, Math.round((item.tokens / spark.max) * 64));
              return (
                <div key={item.day} className="flex flex-col items-center gap-1">
                  <div
                    className="w-2 rounded-full bg-gradient-to-b from-gigaviz-gold to-gigaviz-magenta/70"
                    style={{ height: `${heightPct}px` }}
                    title={`${item.day}: ${formatNumber(item.tokens)}`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {item.day.slice(8, 10)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
