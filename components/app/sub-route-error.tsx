"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

/**
 * Reusable error boundary for workspace sub-routes.
 * Lighter than the root error.tsx — shows module-scoped error
 * with retry and back navigation (no full page reload needed).
 *
 * Usage: re-export from any sub-route's error.tsx:
 * ```tsx
 * export { SubRouteError as default } from "@/components/app/sub-route-error";
 * ```
 */
export function SubRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("appUI.subRouteError");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="max-w-md space-y-4 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/90 p-6 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#f5f5dc]">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[#f5f5dc]/60">
            {t("description")}
          </p>
        </div>
        {error.digest && (
          <p className="text-[11px] text-[#f5f5dc]/40 font-mono">
            {t("errorId", { digest: error.digest })}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 px-4 py-2 text-sm font-semibold text-[#d4af37] transition hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("goBack")}
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2 text-sm font-bold text-[#0a1229] transition hover:bg-[#f9d976]"
          >
            <RefreshCw className="h-4 w-4" />
            {t("tryAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubRouteError;
