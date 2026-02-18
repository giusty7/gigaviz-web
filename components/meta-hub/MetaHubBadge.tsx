"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Status = "live" | "beta" | "soon" | "locked";

const keyMap: Record<Status, string> = {
  live: "live",
  beta: "beta",
  soon: "soon",
  locked: "locked",
};

const styleMap: Record<Status, string> = {
  live: "border border-emerald-400/50 bg-emerald-400/15 text-emerald-100",
  beta: "border border-amber-300/50 bg-amber-300/15 text-amber-100",
  soon: "border border-border bg-gigaviz-surface text-muted-foreground",
  locked: "border border-red-400/50 bg-red-400/15 text-red-100",
};

export function MetaHubBadge({ status = "soon" }: { status?: Status }) {
  const t = useTranslations("metaHubUI.badge");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        styleMap[status]
      )}
    >
      {t(keyMap[status])}
    </span>
  );
}
