"use client";

import { useMemo } from "react";
import {
  BarChart3,
  MessageSquare,
  Cpu,
  Zap,
  Sparkles,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

type UsageData = {
  date: string;
  tokens_in: number;
  tokens_out: number;
  requests: number;
  provider: string;
};

type WorkflowRun = {
  id: string;
  status: string;
  started_at: string;
};

type AnalyticsClientProps = {
  workspaceId: string;
  workspaceSlug: string;
  usageData: UsageData[];
  conversationCount: number;
  messageCount: number;
  workflowRuns: WorkflowRun[];
};

export function AnalyticsClient({
  usageData,
  conversationCount,
  messageCount,
  workflowRuns,
}: AnalyticsClientProps) {
  const t = useTranslations("helperUI.analyticsPage");
  // Calculate totals
  const totals = useMemo(() => {
    const totalTokensIn = usageData.reduce((sum, d) => sum + (d.tokens_in ?? 0), 0);
    const totalTokensOut = usageData.reduce((sum, d) => sum + (d.tokens_out ?? 0), 0);
    const totalRequests = usageData.reduce((sum, d) => sum + (d.requests ?? 0), 0);
    
    // Calculate by provider
    const byProvider: Record<string, { tokensIn: number; tokensOut: number; requests: number }> = {};
    for (const d of usageData) {
      const provider = d.provider || "unknown";
      if (!byProvider[provider]) {
        byProvider[provider] = { tokensIn: 0, tokensOut: 0, requests: 0 };
      }
      byProvider[provider].tokensIn += d.tokens_in ?? 0;
      byProvider[provider].tokensOut += d.tokens_out ?? 0;
      byProvider[provider].requests += d.requests ?? 0;
    }

    return {
      tokensIn: totalTokensIn,
      tokensOut: totalTokensOut,
      totalTokens: totalTokensIn + totalTokensOut,
      requests: totalRequests,
      byProvider,
    };
  }, [usageData]);

  // Workflow stats
  const workflowStats = useMemo(() => {
    const total = workflowRuns.length;
    const successful = workflowRuns.filter((r) => r.status === "success" || r.status === "completed").length;
    const failed = workflowRuns.filter((r) => r.status === "failed" || r.status === "error").length;
    const running = workflowRuns.filter((r) => r.status === "running" || r.status === "pending").length;
    
    return { total, successful, failed, running };
  }, [workflowRuns]);

  // Daily chart data (last 14 days)
  const chartData = useMemo(() => {
    const now = new Date();
    const days: { date: string; label: string; tokens: number; requests: number }[] = [];
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayUsage = usageData.filter((u) => u.date === dateStr);
      
      days.push({
        date: dateStr,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tokens: dayUsage.reduce((sum, u) => sum + (u.tokens_in ?? 0) + (u.tokens_out ?? 0), 0),
        requests: dayUsage.reduce((sum, u) => sum + (u.requests ?? 0), 0),
      });
    }
    
    return days;
  }, [usageData]);

  const maxTokens = Math.max(...chartData.map((d) => d.tokens), 1);
  const maxRequests = Math.max(...chartData.map((d) => d.requests), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#f5f5dc]">{t("title")}</h2>
        <p className="text-[#f5f5dc]/60 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f5dc]/60 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b8860b]" />
              {t("totalTokens")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f5dc]">
              {totals.totalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f5dc]/50 mt-1">
              {totals.tokensIn.toLocaleString()} {t("tokenIn")} / {totals.tokensOut.toLocaleString()} {t("tokenOut")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f5dc]/60 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#b8860b]" />
              {t("apiRequests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f5dc]">
              {totals.requests.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f5dc]/50 mt-1">
              {t("apiRequestsDesc")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f5dc]/60 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#b8860b]" />
              {t("conversations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f5dc]">
              {conversationCount.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f5dc]/50 mt-1">
              {messageCount.toLocaleString()} messages
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#f5f5dc]/60 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#b8860b]" />
              {t("workflowPerformance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5f5dc]">
              {workflowStats.total.toLocaleString()}
            </div>
            <p className="text-xs text-[#f5f5dc]/50 mt-1">
              {t("successCount", { count: workflowStats.successful })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
        <CardHeader>
          <CardTitle className="text-[#f5f5dc] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#b8860b]" />
            {t("tokenUsageChart")}
          </CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">
            {t("tokenUsageDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-1">
            {chartData.map((day, i) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-3/4 bg-gradient-to-t from-[#b8860b] to-[#daa520] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{
                      height: `${Math.max((day.tokens / maxTokens) * 160, 4)}px`,
                    }}
                    title={`${day.tokens.toLocaleString()} tokens`}
                  />
                </div>
                <span className="text-[8px] text-[#f5f5dc]/40 truncate w-full text-center">
                  {i % 2 === 0 ? day.label : ""}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Breakdown & Workflow Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider Breakdown */}
        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader>
            <CardTitle className="text-[#f5f5dc]">{t("usageByProvider")}</CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              {t("usageByProviderDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(totals.byProvider).length === 0 ? (
              <div className="text-center py-8 text-[#f5f5dc]/50">
                {t("noUsageData")}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(totals.byProvider).map(([provider, stats]) => {
                  const percentage = totals.totalTokens > 0
                    ? ((stats.tokensIn + stats.tokensOut) / totals.totalTokens) * 100
                    : 0;
                  
                  return (
                    <div key={provider} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#f5f5dc] capitalize">{provider}</span>
                        <span className="text-[#f5f5dc]/60">
                          {(stats.tokensIn + stats.tokensOut).toLocaleString()} {t("tokensLabel")}
                        </span>
                      </div>
                      <div className="h-2 bg-[#16213e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#b8860b] to-[#daa520] rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Status */}
        <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
          <CardHeader>
            <CardTitle className="text-[#f5f5dc]">{t("workflowPerformance")}</CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              {t("workflowPerfDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflowStats.total === 0 ? (
              <div className="text-center py-8 text-[#f5f5dc]/50">
                {t("noWorkflowRuns")}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[#f5f5dc] font-medium">{t("successful")}</div>
                    <div className="text-sm text-[#f5f5dc]/60">
                      {t("successCount", { count: workflowStats.successful })}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-400">
                    {workflowStats.total > 0
                      ? Math.round((workflowStats.successful / workflowStats.total) * 100)
                      : 0}%
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[#f5f5dc] font-medium">{t("failed")}</div>
                    <div className="text-sm text-[#f5f5dc]/60">
                      {t("failedCount", { count: workflowStats.failed })}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-400">
                    {workflowStats.total > 0
                      ? Math.round((workflowStats.failed / workflowStats.total) * 100)
                      : 0}%
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#b8860b]/20 text-[#b8860b] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[#f5f5dc] font-medium">{t("running")}</div>
                    <div className="text-sm text-[#f5f5dc]/60">
                      {t("runningCount", { count: workflowStats.running })}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-[#b8860b]">
                    {workflowStats.running}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Chart */}
      <Card className="bg-[#1a1a2e]/80 border-[#b8860b]/30">
        <CardHeader>
          <CardTitle className="text-[#f5f5dc] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#b8860b]" />
            {t("apiRequestsChart")}
          </CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">
            {t("apiRequestsChartDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-end gap-1">
            {chartData.map((day, i) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-3/4 bg-gradient-to-t from-[#4a9eff] to-[#7bb8ff] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{
                      height: `${Math.max((day.requests / maxRequests) * 100, 2)}px`,
                    }}
                    title={`${day.requests} requests`}
                  />
                </div>
                <span className="text-[8px] text-[#f5f5dc]/40 truncate w-full text-center">
                  {i % 2 === 0 ? day.label : ""}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
