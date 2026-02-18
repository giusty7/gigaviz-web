"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

type CircularGaugeProps = {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: "gold" | "magenta" | "emerald";
  trend?: number[];
  href?: string;
  ctaLabel?: string;
};

const colorMap = {
  gold: {
    ring: "stroke-[#d4af37]",
    bg: "stroke-[#d4af37]/20",
    text: "text-[#d4af37]",
    glow: "drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]",
  },
  magenta: {
    ring: "stroke-[#e11d48]",
    bg: "stroke-[#e11d48]/20",
    text: "text-[#e11d48]",
    glow: "drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]",
  },
  emerald: {
    ring: "stroke-emerald-500",
    bg: "stroke-emerald-500/20",
    text: "text-emerald-400",
    glow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]",
  },
};

function formatValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * 100;
      const y = 16 - (v / max) * 14;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-4 w-full opacity-70" viewBox="0 0 100 16" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color === "gold" ? "#d4af37" : color === "magenta" ? "#e11d48" : "#10b981"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CircularGauge({
  label,
  value,
  max,
  unit = "",
  color = "gold",
  trend = [],
  href,
  ctaLabel,
}: CircularGaugeProps) {
  const t = useTranslations("dashboardWidgets.circularGauge");
  const resolvedCtaLabel = ctaLabel ?? t("viewDetails");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = colorMap[color];

  // Determine status color based on percentage
  const statusColor =
    percentage >= 80
      ? "text-emerald-400"
      : percentage >= 50
        ? "text-amber-400"
        : "text-[#f5f5dc]/60";

  return (
    <div className="relative flex flex-col items-center justify-between rounded-2xl border border-[#d4af37]/15 bg-[#050a18]/70 p-4 shadow-sm">
      {/* Circular Progress */}
      <div className="relative flex items-center justify-center">
        <svg className={`h-24 w-24 -rotate-90 ${colors.glow}`} viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            className={colors.bg}
          />
          {/* Progress ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={colors.ring}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: mounted ? strokeDashoffset : circumference }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${colors.text}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      {/* Label and values */}
      <div className="mt-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]/80">
          {label}
        </p>
        <p className="mt-1 text-sm text-[#f5f5dc]">
          <span className="font-semibold">{formatValue(value)}</span>
          <span className="text-[#f5f5dc]/50"> / {formatValue(max)}</span>
          {unit && <span className="text-[#f5f5dc]/50"> {unit}</span>}
        </p>
        <p className={`mt-1 text-[10px] font-semibold uppercase ${statusColor}`}>
          {percentage >= 80 ? t("healthy") : percentage >= 50 ? t("moderate") : t("low")}
        </p>
      </div>

      {/* Sparkline */}
      {trend.length > 0 && (
        <div className="mt-3 w-full px-2">
          <Sparkline data={trend} color={color} />
          <p className="mt-1 text-center text-[9px] text-[#f5f5dc]/40">{t("trend7Day")}</p>
        </div>
      )}

      {/* CTA */}
      {href && (
        <a
          href={href}
          className="mt-3 inline-flex items-center gap-1 rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 px-3 py-1.5 text-[10px] font-semibold text-[#f5f5dc] transition hover:border-[#d4af37]/60 hover:text-[#d4af37]"
        >
          {resolvedCtaLabel} →
        </a>
      )}
    </div>
  );
}
