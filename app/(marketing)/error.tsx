"use client";
import { logger } from "@/lib/logging";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    Sentry.captureException(error);
    logger.error("[marketing-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          {t("somethingWrong")}
        </h2>
        <p className="text-muted-foreground">
          {t("somethingWrongDesc")}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
          >
            <RefreshCw className="h-4 w-4" />
            {t("tryAgain")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
