"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Info, Lock, ArrowRight } from "lucide-react";
import type { ProductWidget } from "@/lib/dashboard/overview";

type ProductKPICardProps = {
  widget: ProductWidget;
  index: number;
};

const statusConfig = {
  live: {
    badgeKey: "statusLive" as const,
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    borderClass: "border-[#f5f5dc]/[0.06] hover:border-emerald-500/30",
  },
  beta: {
    badgeKey: "statusBeta" as const,
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    borderClass: "border-[#f5f5dc]/[0.06] hover:border-blue-500/30",
  },
  locked: {
    badgeKey: "statusLocked" as const,
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    borderClass: "border-[#f5f5dc]/[0.06] hover:border-amber-500/30",
  },
  "coming-soon": {
    badgeKey: "statusSoon" as const,
    badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    borderClass: "border-[#f5f5dc]/[0.06] hover:border-slate-500/30",
  },
};

const alertIcons = {
  info: Info,
  warning: AlertCircle,
  error: AlertCircle,
  success: CheckCircle2,
};

const alertColors = {
  info: "text-blue-400",
  warning: "text-amber-400",
  error: "text-red-400",
  success: "text-emerald-400",
};

export function ProductKPICard({ widget }: ProductKPICardProps) {
  const t = useTranslations("dashboardWidgetsUI");
  const config = statusConfig[widget.status];
  const isLocked = widget.status === "locked";
  const isComingSoon = widget.status === "coming-soon";

  return (
    <div
      className={`group relative rounded-xl border ${config.borderClass} bg-[#f5f5dc]/[0.02] transition-colors`}
    >
      {/* Header row: name + badge */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isLocked && <Lock className="h-3 w-3 text-amber-400 shrink-0" />}
          <h3 className="text-sm font-semibold text-[#f5f5dc] truncate">
            {widget.productName}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border ${config.badgeClass}`}
        >
          {t(config.badgeKey)}
        </span>
      </div>

      {/* Metrics — compact key/value pairs */}
      <div className="px-4 pb-2 space-y-1">
        {widget.metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#f5f5dc]/40">
              {metric.icon && <span className="mr-0.5">{metric.icon}</span>}
              {metric.label}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold tabular-nums ${isComingSoon ? "text-[#f5f5dc]/30" : "text-[#f5f5dc]/90"}`}>
                {metric.value}
              </span>
              {metric.trend !== undefined && metric.trend !== 0 && (
                <span
                  className={`text-[10px] font-semibold ${
                    metric.trend > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {metric.trend > 0 ? "↑" : "↓"}{Math.abs(metric.trend)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Alert — inline, compact */}
      {widget.alert && (() => {
        const AlertIcon = alertIcons[widget.alert.type];
        const color = alertColors[widget.alert.type];
        return (
          <div className="mx-4 mb-2 flex items-center gap-1.5 rounded-md bg-[#f5f5dc]/[0.03] px-2 py-1">
            <AlertIcon className={`h-3 w-3 shrink-0 ${color}`} />
            <p className="text-[10px] text-[#f5f5dc]/60 truncate">{widget.alert.message}</p>
          </div>
        );
      })()}

      {/* Quick action — subtle link, not a button */}
      {widget.quickAction && (
        <Link
          href={widget.quickAction.href}
          className="flex items-center justify-between border-t border-[#f5f5dc]/[0.04] px-4 py-2 text-[11px] font-medium text-[#d4af37]/70 transition hover:bg-[#d4af37]/[0.04] hover:text-[#d4af37]"
        >
          {widget.quickAction.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 rounded-xl bg-[#050a18]/50 backdrop-blur-[1px] pointer-events-none" />
      )}
    </div>
  );
}
