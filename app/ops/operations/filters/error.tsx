"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-slate-400">Something went wrong.</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    </div>
  );
}
