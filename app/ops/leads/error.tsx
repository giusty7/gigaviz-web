"use client";

export default function OpsLeadsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <h2 className="text-2xl font-bold text-red-400 mb-2">Leads Error</h2>
      <p className="text-slate-400 mb-4">{error.message || "Failed to load leads."}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
