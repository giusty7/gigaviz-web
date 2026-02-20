export default function ContentLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[#f5f5dc]/5" />
      <div className="h-4 w-72 animate-pulse rounded bg-[#f5f5dc]/5" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl border border-[#f5f5dc]/5 bg-[#0a1229]/60" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-[#f5f5dc]/5 bg-[#0a1229]/60" />
        ))}
      </div>
    </div>
  );
}
