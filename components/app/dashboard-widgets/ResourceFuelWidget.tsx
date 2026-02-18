"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Fuel, MessageSquare, Bot, Cloud } from "lucide-react";

type ResourceData = {
  name: string;
  icon: React.ReactNode;
  used: number | null;
  total: number | null;
  unit: string;
  gradient: { start: string; end: string };
};

type TokenOverviewResponse = {
  overview?: {
    used?: number;
    cap?: number | null;
  };
};

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function CircularProgress({
  percentage,
  gradient,
  size = 80,
  strokeWidth = 6,
}: {
  percentage: number;
  gradient: { start: string; end: string };
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const gradientId = `progress-${gradient.start.replace("#", "")}`;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradient.start} />
          <stop offset="100%" stopColor={gradient.end} />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(245, 245, 220, 0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 6px ${gradient.start}40)` }}
      />
    </svg>
  );
}

type ResourceFuelWidgetProps = {
  workspaceId: string;
};

export function ResourceFuelWidget({ workspaceId }: ResourceFuelWidgetProps) {
  const t = useTranslations("dashboardWidgetsUI");
  const { data, isLoading } = useQuery<TokenOverviewResponse>({
    queryKey: ["token-overview", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/tokens/overview?workspaceId=${workspaceId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("token_overview_failed");
      }
      return res.json();
    },
    staleTime: 60_000,
  });

  const resources = useMemo<ResourceData[]>(() => {
    const usedRaw = data?.overview?.used;
    const capRaw = data?.overview?.cap;
    const used = typeof usedRaw === "number" && Number.isFinite(usedRaw) ? usedRaw : null;
    const cap = typeof capRaw === "number" && Number.isFinite(capRaw) ? capRaw : null;

    return [
      {
        name: t("waQuota"),
        icon: <MessageSquare className="h-4 w-4" />,
        used: null,
        total: null,
        unit: t("unitMsgs"),
        gradient: { start: "#d4af37", end: "#f9d976" },
      },
      {
        name: t("aiTokens"),
        icon: <Bot className="h-4 w-4" />,
        used,
        total: cap,
        unit: t("unitTokens"),
        gradient: { start: "#e11d48", end: "#f43f5e" },
      },
      {
        name: t("cloudStorage"),
        icon: <Cloud className="h-4 w-4" />,
        used: null,
        total: null,
        unit: t("unitGB"),
        gradient: { start: "#d4af37", end: "#e11d48" },
      },
    ];
  }, [data?.overview?.cap, data?.overview?.used, t]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl">
      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-center-soft"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("resourceFuel")}</h3>
        </div>

        <div className="mt-5 flex items-center justify-around gap-2">
          {resources.map((resource, index) => {
            const percentage =
              resource.used !== null && resource.total !== null && resource.total > 0
                ? Math.round((resource.used / resource.total) * 100)
                : 0;
            const usageLabel =
              isLoading && resource.name === t("aiTokens")
                ? t("loadingDot")
                : resource.used === null
                  ? "No data yet"
                  : resource.total === null || resource.total === 0
                    ? `${formatNumber(resource.used)} ${resource.unit}`
                    : `${formatNumber(resource.used)}/${formatNumber(resource.total)} ${resource.unit}`;
            return (
              <motion.div
                key={resource.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <CircularProgress percentage={percentage} gradient={resource.gradient} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-[90deg]">
                    <span className="text-[#f5f5dc]/60">{resource.icon}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-[#f5f5dc]">{resource.name}</p>
                  <p className="mt-0.5 text-[10px] text-[#f5f5dc]/50">
                    {usageLabel}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
