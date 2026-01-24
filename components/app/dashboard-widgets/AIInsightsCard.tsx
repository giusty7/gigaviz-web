import Link from "next/link";
import { TrendingUp, AlertTriangle, Lightbulb, Sparkles } from "lucide-react";

export type InsightType = "performance" | "attention" | "recommendation";

export type InsightItem = {
  type: InsightType;
  title: string;
  message: string;
  href?: string;
  ctaLabel?: string;
};

type AIInsightsCardProps = {
  insights: InsightItem[];
  workspaceSlug: string;
};

const iconMap: Record<InsightType, React.ReactNode> = {
  performance: <TrendingUp className="h-4 w-4 text-emerald-400" />,
  attention: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  recommendation: <Lightbulb className="h-4 w-4 text-[#d4af37]" />,
};

const borderMap: Record<InsightType, string> = {
  performance: "border-l-emerald-500/50",
  attention: "border-l-amber-500/50",
  recommendation: "border-l-[#d4af37]/50",
};

export default function AIInsightsCard({ insights, workspaceSlug }: AIInsightsCardProps) {
  if (!insights.length) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#e11d48]/20 bg-[#0a1229]/70 p-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#e11d48]/5 to-transparent" />
        <div className="relative flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#e11d48]" />
          <div>
            <p className="text-sm font-semibold text-[#f5f5dc]">AI Insights</p>
            <p className="text-xs text-[#f5f5dc]/60">
              No insights yet. Use your workspace to generate activity data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e11d48]/20 bg-[#0a1229]/70">
      {/* Magenta glow border effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#e11d48]/5 to-transparent" />
      <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#e11d48] via-[#e11d48]/50 to-transparent" />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-[#e11d48]/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#e11d48]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#e11d48]">
            AI Insights
          </span>
        </div>
        <span className="rounded-full bg-[#e11d48]/10 px-2 py-0.5 text-[9px] font-semibold text-[#e11d48]">
          Powered by Helper
        </span>
      </div>

      {/* Insights list */}
      <div className="relative divide-y divide-[#e11d48]/10">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 border-l-2 px-5 py-3 ${borderMap[insight.type]}`}
          >
            <div className="mt-0.5 flex-shrink-0">{iconMap[insight.type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/50">
                {insight.title}
              </p>
              <p className="mt-1 text-sm text-[#f5f5dc]/90">{insight.message}</p>
              {insight.href && insight.ctaLabel && (
                <Link
                  href={insight.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#d4af37] hover:underline"
                >
                  {insight.ctaLabel} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="relative border-t border-[#e11d48]/10 px-5 py-2">
        <Link
          href={`/${workspaceSlug}/helper`}
          className="text-xs text-[#f5f5dc]/50 hover:text-[#e11d48] transition"
        >
          Ask Helper for more insights →
        </Link>
      </div>
    </div>
  );
}
