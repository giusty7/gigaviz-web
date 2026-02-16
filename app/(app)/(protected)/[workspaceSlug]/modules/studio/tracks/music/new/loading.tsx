export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-[#f5f5dc]/5" />
        <div className="h-4 w-72 rounded bg-[#f5f5dc]/5" />
      </div>
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-[#f5f5dc]/5 bg-[#0a1229]/40" />
        ))}
      </div>
      <div className="h-10 w-full rounded-lg bg-[#f5f5dc]/5" />
      <div className="h-32 w-full rounded-lg bg-[#f5f5dc]/5" />
      <div className="h-10 w-32 rounded-lg bg-[#f5f5dc]/5" />
    </div>
  );
}
