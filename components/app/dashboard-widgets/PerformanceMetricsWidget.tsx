"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { TrendingUp, Activity } from "lucide-react";

type MetricData = {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
};

const metrics: MetricData[] = [];

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const width = 200;
  const height = 50;
  const padding = 4;
  
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(" ");
  
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <motion.polygon
        points={areaPoints}
        fill="url(#sparklineGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      {/* Line stroke */}
      <motion.polyline
        points={points}
        fill="none"
        stroke="url(#strokeGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      {/* End dot */}
      <motion.circle
        cx={width - padding}
        cy={height - padding - ((data[data.length - 1] - minVal) / range) * (height - 2 * padding)}
        r="3"
        fill="#e11d48"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, duration: 0.3 }}
      />
    </svg>
  );
}

export function PerformanceMetricsWidget() {
  const t = useTranslations("dashboardWidgetsUI");
  const hasMetrics = metrics.length > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl">
      {/* Gradient overlays */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-magenta-bl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-gold-tr-soft"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#d4af37]" />
            <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("performanceMetrics")}</h3>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">{t("last30days")}</span>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {hasMetrics ? (
            metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <p className="text-xs text-[#f5f5dc]/50">{metric.label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
                    {metric.value}
                  </span>
                  <span
                    className={`flex items-center text-xs font-medium ${
                      metric.isPositive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    <TrendingUp className="mr-0.5 h-3 w-3" />
                    {metric.change}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-xs text-[#f5f5dc]/60">{t("noDataYet")}</div>
          )}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">{t("activityTrend")}</p>
          {hasMetrics ? (
            <Sparkline data={[0, 0, 0]} className="h-12 w-full" />
          ) : (
            <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/40 px-3 py-2 text-xs text-[#f5f5dc]/60">
              {t("noDataYet")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
