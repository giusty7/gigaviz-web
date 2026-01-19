"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

type InsightType = "suggestion" | "insight" | "warning";

type InsightItem = {
  id: string;
  type: InsightType;
  message: string;
  timestamp: string;
};

type HelperUsageResponse = {
  ok?: boolean;
  today?: {
    total?: number;
  };
  monthly?: {
    total?: number;
    cap?: number;
    isOverBudget?: boolean;
  };
};

const typeConfig: Record<InsightType, { icon: React.ReactNode; color: string }> = {
  suggestion: { icon: <Lightbulb className="h-3.5 w-3.5" />, color: "#d4af37" },
  insight: { icon: <TrendingUp className="h-3.5 w-3.5" />, color: "#10b981" },
  warning: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "#e11d48" },
};

type AIAssistantFeedWidgetProps = {
  workspaceId: string;
};

export function AIAssistantFeedWidget({ workspaceId }: AIAssistantFeedWidgetProps) {
  const { data } = useQuery<HelperUsageResponse>({
    queryKey: ["helper-usage", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/helper/usage?workspaceId=${workspaceId}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("helper_usage_failed");
      }
      return res.json();
    },
    staleTime: 60_000,
  });

  const insights = useMemo<InsightItem[]>(() => {
    const todayTotal = Number(data?.today?.total ?? 0);
    const monthlyTotal = Number(data?.monthly?.total ?? 0);
    const monthlyCap = Number(data?.monthly?.cap ?? 0);
    const isOverBudget = Boolean(data?.monthly?.isOverBudget);
    const items: InsightItem[] = [];

    if (todayTotal > 0) {
      items.push({
        id: "today-usage",
        type: "insight",
        message: `Helper used ${todayTotal.toLocaleString()} tokens today.`,
        timestamp: "Today",
      });
    }

    if (monthlyTotal > 0) {
      items.push({
        id: "monthly-usage",
        type: "suggestion",
        message:
          monthlyCap > 0
            ? `Monthly usage: ${monthlyTotal.toLocaleString()} of ${monthlyCap.toLocaleString()} tokens.`
            : `Monthly usage: ${monthlyTotal.toLocaleString()} tokens (cap not set).`,
        timestamp: "This month",
      });
    }

    if (monthlyCap > 0 && (isOverBudget || (monthlyTotal / monthlyCap) * 100 >= 80)) {
      items.push({
        id: "budget-warning",
        type: "warning",
        message: isOverBudget
          ? "Helper usage exceeded the monthly cap."
          : "Helper usage is nearing the monthly cap.",
        timestamp: "This month",
      });
    }

    return items;
  }, [data?.monthly?.cap, data?.monthly?.isOverBudget, data?.monthly?.total, data?.today?.total]);

  const hasInsights = insights.length > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl">
      {/* Magenta glow background */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-magenta-br"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-magenta-tl-soft"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#e11d48]" />
            <h3 className="text-sm font-semibold text-[#f5f5dc]">Helper Insights</h3>
          </div>
          <motion.span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
              hasInsights
                ? "bg-[#e11d48]/15 text-[#e11d48]"
                : "bg-[#f5f5dc]/10 text-[#f5f5dc]/60"
            }`}
            animate={hasInsights ? { opacity: [0.7, 1, 0.7] } : undefined}
            transition={hasInsights ? { duration: 2, repeat: Infinity } : undefined}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasInsights ? "bg-[#e11d48]" : "bg-[#f5f5dc]/50"
              }`}
            />
            {hasInsights ? "AI Active" : "No data yet"}
          </motion.span>
        </div>

        <div className="mt-4 space-y-3 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#f5f5dc]/10">
          {hasInsights ? (
            insights.map((insight, index) => {
              const config = typeConfig[insight.type];
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.12 }}
                  className="group flex gap-3 rounded-xl border border-[#f5f5dc]/5 bg-[#050a18]/50 p-3 transition-colors hover:border-[#d4af37]/20"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${config.color}15`, color: config.color }}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed text-[#f5f5dc]/80">{insight.message}</p>
                    <p className="mt-1 text-[10px] text-[#f5f5dc]/40">{insight.timestamp}</p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="rounded-xl border border-[#f5f5dc]/5 bg-[#050a18]/40 p-3 text-xs text-[#f5f5dc]/60">
              No helper insights yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
