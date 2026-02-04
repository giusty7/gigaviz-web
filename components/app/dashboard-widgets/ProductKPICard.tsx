"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, Lock } from "lucide-react";
import type { ProductWidget } from "@/lib/dashboard/overview";

type ProductKPICardProps = {
  widget: ProductWidget;
  index: number;
};

const statusConfig = {
  live: {
    badge: "LIVE",
    badgeClass: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
    borderClass: "border-emerald-500/30 hover:border-emerald-500/50",
    accentClass: "text-emerald-400",
  },
  beta: {
    badge: "BETA",
    badgeClass: "bg-blue-500/15 text-blue-200 border-blue-500/40",
    borderClass: "border-blue-500/30 hover:border-blue-500/50",
    accentClass: "text-blue-400",
  },
  locked: {
    badge: "LOCKED",
    badgeClass: "bg-amber-500/15 text-amber-200 border-amber-500/40",
    borderClass: "border-amber-500/30 hover:border-amber-500/50",
    accentClass: "text-amber-400",
  },
  "coming-soon": {
    badge: "SOON",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/40",
    borderClass: "border-slate-500/30 hover:border-slate-500/50",
    accentClass: "text-slate-400",
  },
};

const alertConfig = {
  info: {
    icon: Info,
    bgClass: "bg-blue-500/10 border-blue-500/30",
    textClass: "text-blue-200",
    iconClass: "text-blue-400",
  },
  warning: {
    icon: AlertCircle,
    bgClass: "bg-amber-500/10 border-amber-500/30",
    textClass: "text-amber-200",
    iconClass: "text-amber-400",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-red-500/10 border-red-500/30",
    textClass: "text-red-200",
    iconClass: "text-red-400",
  },
  success: {
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
    textClass: "text-emerald-200",
    iconClass: "text-emerald-400",
  },
};

export function ProductKPICard({ widget, index }: ProductKPICardProps) {
  const config = statusConfig[widget.status];
  const isLocked = widget.status === "locked";
  const isComingSoon = widget.status === "coming-soon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-2xl border ${config.borderClass} bg-[#0a1229]/80 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg`}
    >
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

      {/* Content */}
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isLocked && <Lock className="h-4 w-4 text-amber-400" />}
              <h3 className="text-base font-bold text-[#f5f5dc] truncate">
                {widget.productName}
              </h3>
            </div>
          </div>
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${config.badgeClass}`}
          >
            {config.badge}
          </span>
        </div>

        {/* Metrics */}
        <div className="space-y-2.5">
          {widget.metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#f5f5dc]/60 font-medium">
                {metric.icon && <span className="mr-1">{metric.icon}</span>}
                {metric.label}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isComingSoon ? "text-[#f5f5dc]/50" : "text-[#f5f5dc]"}`}>
                  {metric.value}
                </span>
                {metric.trend !== undefined && metric.trend !== 0 && (
                  <span
                    className={`text-xs font-semibold ${
                      metric.trend > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {metric.trend > 0 ? "↑" : "↓"} {Math.abs(metric.trend)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Alert */}
        {widget.alert && (
          <div
            className={`rounded-xl border p-3 ${
              alertConfig[widget.alert.type].bgClass
            }`}
          >
            <div className="flex items-start gap-2">
              {(() => {
                const AlertIcon = alertConfig[widget.alert.type].icon;
                return (
                  <AlertIcon
                    className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      alertConfig[widget.alert.type].iconClass
                    }`}
                  />
                );
              })()}
              <p
                className={`text-xs font-medium ${
                  alertConfig[widget.alert.type].textClass
                }`}
              >
                {widget.alert.message}
              </p>
            </div>
          </div>
        )}

        {/* Quick Action */}
        {widget.quickAction && (
          <Link
            href={widget.quickAction.href}
            className={`block w-full rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 px-4 py-2.5 text-center text-sm font-semibold ${config.accentClass} transition hover:border-[#d4af37]/60 hover:bg-[#d4af37]/5`}
          >
            {widget.quickAction.label} →
          </Link>
        )}
      </div>

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-[#0a1229]/60 backdrop-blur-[2px] pointer-events-none" />
      )}
    </motion.div>
  );
}
