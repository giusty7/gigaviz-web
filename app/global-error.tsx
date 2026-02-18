"use client";
import { logger } from "@/lib/logging";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    logger.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main id="main-content" className="flex min-h-screen items-center justify-center">
          <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Terjadi kesalahan
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Oops, something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kami telah mencatat error ini. Coba ulang atau kembali ke dashboard.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-border bg-gigaviz-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
              >
                Coba lagi
              </button>
              <Link
                href="/"
                className="rounded-lg border border-border bg-gigaviz-gold px-4 py-2 text-sm font-semibold text-gigaviz-navy hover:bg-gigaviz-gold/90"
              >
                Kembali ke home
              </Link>
            </div>
            {error.digest ? (
              <p className="mt-3 text-[11px] text-muted-foreground">Error id: {error.digest}</p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
