"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[ops-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md space-y-4 rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            Ops Console Error
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Something went wrong while loading this page. The error has been logged.
          </p>
        </div>
        {error.message && (
          <p className="rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-300 font-mono break-all">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="text-[11px] text-slate-500">Error ID: {error.digest}</p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <Link
            href="/ops"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition"
          >
            <Home className="h-4 w-4" />
            Ops Home
          </Link>
        </div>
      </div>
    </div>
  );
}
