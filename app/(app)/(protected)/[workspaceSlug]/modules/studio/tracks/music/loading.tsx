export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-[#f5f5dc]/5" />
          <div className="h-4 w-72 rounded bg-[#f5f5dc]/5" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-[#f5f5dc]/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-[#f5f5dc]/5 bg-[#0a1229]/40" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl border border-[#f5f5dc]/5 bg-[#0a1229]/40" />
        ))}
      </div>
    </div>
  );
}
