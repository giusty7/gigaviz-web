"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureGateProps = {
  allowed?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
};

export function FeatureGate({
  allowed = true,
  children,
  fallback,
  className,
}: FeatureGateProps) {
  const t = useTranslations("featureGateUI");

  if (allowed) return <>{children}</>;

  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/50 px-4 py-6 text-sm text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-2 text-foreground">
        <Lock className="h-4 w-4" />
        {t("locked")}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("contactSupport")}
      </p>
    </div>
  );
}
