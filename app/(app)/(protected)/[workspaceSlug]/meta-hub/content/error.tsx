"use client";

export default function ContentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 py-16 text-center">
      <p className="text-sm font-semibold text-red-400">Something went wrong</p>
      <p className="mt-1 text-xs text-[#f5f5dc]/40">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/30"
      >
        Try again
      </button>
    </div>
  );
}
