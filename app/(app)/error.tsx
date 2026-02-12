"use client";
import { logger } from "@/lib/logging";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    Sentry.captureException(error);
    logger.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("somethingWrong")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("somethingWrongDesc")}
          </p>
        </div>
        {error.digest && (
          <p className="text-[11px] text-muted-foreground">Error ID: {error.digest}</p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
          >
            <RefreshCw className="h-4 w-4" />
            {t("tryAgain")}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            <Home className="h-4 w-4" />
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
