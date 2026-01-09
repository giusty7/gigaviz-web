"use client";

import Link from "next/link";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

type Props = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function DisabledModuleState({
  title,
  description,
  ctaLabel = "Hubungi Sales",
  ctaHref = "/contact",
}: Props) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
      <MetaHubBadge status="soon" />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Link
        href={ctaHref}
        className="mt-2 inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
