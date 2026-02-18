"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import FeatureInterestDialog from "@/components/app/FeatureInterestDialog";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

type Props = {
  title: string;
  description: string;
  workspaceId?: string;
  moduleSlug?: string;
  moduleName?: string;
  badgeStatus?: "live" | "beta" | "soon" | "locked";
  ctaLabel?: string;
  ctaHref?: string;
};

export function DisabledModuleState({
  title,
  description,
  workspaceId,
  moduleSlug,
  moduleName,
  badgeStatus = "soon",
  ctaLabel,
  ctaHref = "/contact",
}: Props) {
  const t = useTranslations("metaHubUI.disabledModule");
  const resolvedCtaLabel = ctaLabel ?? t("notifyMe");
  const showNotify = Boolean(workspaceId && moduleSlug);

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
      <MetaHubBadge status={badgeStatus} />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      {showNotify ? (
        <FeatureInterestDialog workspaceId={workspaceId!}>
          {(openDialog) => (
            <button
              type="button"
              onClick={() => openDialog(moduleSlug!, moduleName ?? title)}
              className="mt-2 inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
            >
              {resolvedCtaLabel}
            </button>
          )}
        </FeatureInterestDialog>
      ) : (
        <Link
          href={ctaHref}
          className="mt-2 inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
        >
          {resolvedCtaLabel}
        </Link>
      )}
    </div>
  );
}
