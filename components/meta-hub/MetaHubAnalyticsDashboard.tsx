"use client";
import { logger } from "@/lib/logging";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  TrendingUp,
  MessageSquare,
  Send,
  Clock,
  Tag,
  Zap,
  BarChart3,
  Activity,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type TimeRange = "7d" | "30d" | "90d";

type AnalyticsData = {
  totalThreads: number;
  totalMessages: number;
  automationTriggers: number;
  avgResponseTimeMs: number;
  threadsByStatus: { status: string; count: number }[];
  messagesByDay: { date: string; inbound: number; outbound: number }[];
  topTags: { tag: string; count: number }[];
  tokenUsage: number;
  period: TimeRange;
};

interface MetaHubAnalyticsDashboardProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function MetaHubAnalyticsDashboard({
  workspaceId,
}: Omit<MetaHubAnalyticsDashboardProps, 'workspaceSlug'>) {
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.analyticsDashboard");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, workspaceId]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/meta/whatsapp/analytics/stats?workspaceId=${workspaceId}&period=${timeRange}`
      );
      const responseData = await res.json();

      if (!res.ok || responseData.error) {
        throw new Error(responseData.error || "Failed to fetch analytics");
      }

      setData(responseData);
    } catch (error) {
      logger.error("Analytics fetch error:", error);
      toast({
        title: t("toastFailed"),
        description: error instanceof Error ? error.message : t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(
        `/api/meta/whatsapp/analytics/export?workspaceId=${workspaceId}&period=${timeRange}`
      );

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gigaviz-analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t("toastExportSuccess"),
        description: t("toastExportSuccessDesc"),
      });
    } catch (error) {
      toast({
        title: t("toastExportFailed"),
        description: error instanceof Error ? error.message : t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#d4af37]" />
          <p className="mt-4 text-sm text-[#f5f5dc]/60">{t("loadingAnalytics")}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-8 text-center">
        <Activity className="mx-auto h-12 w-12 text-[#f5f5dc]/30" />
        <p className="mt-4 text-sm text-[#f5f5dc]/60">{t("noDataAvailable")}</p>
      </div>
    );
  }

  const safeData: AnalyticsData = {
    totalThreads: data.totalThreads ?? 0,
    totalMessages: data.totalMessages ?? 0,
    automationTriggers: data.automationTriggers ?? 0,
    avgResponseTimeMs: data.avgResponseTimeMs ?? 0,
    threadsByStatus: data.threadsByStatus ?? [],
    messagesByDay: data.messagesByDay ?? [],
    topTags: data.topTags ?? [],
    tokenUsage: data.tokenUsage ?? 0,
    period: data.period ?? timeRange,
  };

  const maxMessages = Math.max(
    0,
    ...safeData.messagesByDay.map((d) => d.inbound + d.outbound)
  );

  const view = safeData;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Time Range Selector */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f9d976]">{t("title")}</h2>
          <p className="mt-1 text-sm text-[#f5f5dc]/60">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-[#d4af37]/20 bg-[#050a18]/80 p-1">
            {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                  timeRange === range
                    ? "bg-[#d4af37]/20 text-[#f9d976]"
                    : "text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]"
                )}
              >
                {range === "7d" && t("last7Days")}
                {range === "30d" && t("last30Days")}
                {range === "90d" && t("last90Days")}
              </button>
            ))}
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            className="gap-2 border-[#d4af37]/30 text-[#f5f5dc] hover:bg-[#d4af37]/10"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("exporting")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("exportCsv")}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-[#d4af37]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#d4af37]/20 p-3">
              <MessageSquare className="h-6 w-6 text-[#f9d976]" />
            </div>
            <div>
              <p className="text-sm text-[#f5f5dc]/60">{t("totalThreads")}</p>
              <p className="text-2xl font-bold text-[#f5f5dc]">{view.totalThreads.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-[#10b981]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#10b981]/20 p-3">
              <Send className="h-6 w-6 text-[#10b981]" />
            </div>
            <div>
              <p className="text-sm text-[#f5f5dc]/60">{t("messagesSent")}</p>
              <p className="text-2xl font-bold text-[#f5f5dc]">{view.totalMessages.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-[#f59e0b]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#f59e0b]/20 p-3">
              <Zap className="h-6 w-6 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-sm text-[#f5f5dc]/60">{t("automations")}</p>
              <p className="text-2xl font-bold text-[#f5f5dc]">{view.automationTriggers.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-[#8b5cf6]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#8b5cf6]/20 p-3">
              <Clock className="h-6 w-6 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-sm text-[#f5f5dc]/60">{t("avgResponseTime")}</p>
              <p className="text-2xl font-bold text-[#f5f5dc]">
                {formatDuration(view.avgResponseTimeMs)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Thread Status Distribution */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-[#d4af37]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold text-[#f5f5dc]">{t("threadStatus")}</h3>
          </div>

          <div className="space-y-3">
            {(view.threadsByStatus || []).map((item) => {
              const total = view.threadsByStatus.reduce((sum, s) => sum + s.count, 0);
              const percentage = total > 0 ? (item.count / total) * 100 : 0;

              let colorClass = "bg-[#d4af37]";
              if (item.status === "open") colorClass = "bg-[#10b981]";
              else if (item.status === "pending") colorClass = "bg-[#f59e0b]";
              else if (item.status === "closed") colorClass = "bg-[#6b7280]";

              return (
                <div key={item.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize text-[#f5f5dc]/80">{item.status}</span>
                    <span className="font-semibold text-[#f5f5dc]">
                      {item.count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f5f5dc]/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn("h-full", colorClass)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Message Volume Over Time */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-[#d4af37]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold text-[#f5f5dc]">{t("messageVolume")}</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span className="text-[#f5f5dc]/60">{t("inbound")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#d4af37]" />
                <span className="text-[#f5f5dc]/60">{t("outbound")}</span>
              </div>
            </div>

            <div className="flex h-48 items-end gap-1">
              {(view.messagesByDay || []).slice(-14).map((day, idx) => {
                const inboundHeight = maxMessages > 0 ? (day.inbound / maxMessages) * 100 : 0;
                const outboundHeight = maxMessages > 0 ? (day.outbound / maxMessages) * 100 : 0;

                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <div className="relative flex w-full flex-col-reverse gap-0.5">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${inboundHeight}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="w-full rounded-t-sm bg-[#10b981]"
                        title={`Inbound: ${day.inbound}`}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${outboundHeight}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="w-full rounded-t-sm bg-[#d4af37]"
                        title={`Outbound: ${day.outbound}`}
                      />
                    </div>
                    {idx % 2 === 0 && (
                      <span className="text-[10px] text-[#f5f5dc]/40">
                        {new Date(day.date).getDate()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Tags */}
      {view.topTags.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-[#d4af37]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#d4af37]" />
            <h3 className="text-lg font-semibold text-[#f5f5dc]">{t("topTags")}</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {(view.topTags || []).slice(0, 15).map((item) => {
              const maxCount = view.topTags?.[0]?.count ?? 1;
              const intensity = (item.count / maxCount) * 100;

              return (
                <div
                  key={item.tag}
                  className="rounded-lg border border-[#d4af37]/30 bg-[#050a18]/50 px-3 py-1.5"
                  style={{
                    opacity: 0.4 + (intensity / 100) * 0.6,
                  }}
                >
                  <span className="text-sm font-medium text-[#f5f5dc]">{item.tag}</span>
                  <span className="ml-2 text-xs text-[#f5f5dc]/60">({item.count})</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Token Usage */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-[#8b5cf6]/20 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#8b5cf6]/20 p-3">
              <Activity className="h-6 w-6 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-sm text-[#f5f5dc]/60">{t("tokenUsage")}</p>
              <p className="text-2xl font-bold text-[#f5f5dc]">{view.tokenUsage.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right text-xs text-[#f5f5dc]/60">
            <p>{t("period")}: {timeRange}</p>
            <p className="mt-1">
              {timeRange === "7d" && t("last7Days")}
              {timeRange === "30d" && t("last30Days")}
              {timeRange === "90d" && t("last90Days")}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
