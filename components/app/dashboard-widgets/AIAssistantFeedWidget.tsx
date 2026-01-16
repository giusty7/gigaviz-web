"use client";

import { motion } from "framer-motion";
import { Sparkles, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

type InsightType = "suggestion" | "insight" | "warning";

type InsightItem = {
  id: string;
  type: InsightType;
  message: string;
  timestamp: string;
};

const insights: InsightItem[] = [
  {
    id: "1",
    type: "suggestion",
    message: "Response time can be improved by 23% with template pre-caching.",
    timestamp: "2 mins ago",
  },
  {
    id: "2",
    type: "insight",
    message: "Peak activity detected between 9-11 AM. Consider scheduling broadcasts.",
    timestamp: "15 mins ago",
  },
  {
    id: "3",
    type: "warning",
    message: "WA quota reaching 85%. Consider upgrading or optimizing message flow.",
    timestamp: "1 hour ago",
  },
];

const typeConfig: Record<InsightType, { icon: React.ReactNode; color: string }> = {
  suggestion: { icon: <Lightbulb className="h-3.5 w-3.5" />, color: "#d4af37" },
  insight: { icon: <TrendingUp className="h-3.5 w-3.5" />, color: "#10b981" },
  warning: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "#e11d48" },
};

export function AIAssistantFeedWidget() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl">
      {/* Magenta glow background */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at bottom right, rgba(225, 29, 72, 0.1) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at top left, rgba(225, 29, 72, 0.06) 0%, transparent 40%)",
        }}
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#e11d48]" />
            <h3 className="text-sm font-semibold text-[#f5f5dc]">Helper Insights</h3>
          </div>
          <motion.span
            className="flex items-center gap-1 rounded-full bg-[#e11d48]/15 px-2 py-0.5 text-[9px] font-medium text-[#e11d48]"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#e11d48]" />
            AI Active
          </motion.span>
        </div>

        <div className="mt-4 space-y-3 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#f5f5dc]/10">
          {insights.map((insight, index) => {
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
          })}
        </div>
      </div>
    </div>
  );
}
