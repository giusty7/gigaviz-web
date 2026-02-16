export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-7 w-20 rounded-lg bg-[#f5f5dc]/5" />
        <div className="h-5 w-16 rounded-full bg-[#f5f5dc]/5" />
        <div className="h-5 w-16 rounded-full bg-[#f5f5dc]/5" />
      </div>
      <div className="space-y-2">
        <div className="h-6 w-64 rounded bg-[#f5f5dc]/5" />
        <div className="h-4 w-96 rounded bg-[#f5f5dc]/5" />
      </div>
      <div className="h-72 rounded-xl border border-[#f5f5dc]/5 bg-[#0a1229]/40" />
      <div className="flex gap-2">
        <div className="h-8 w-16 rounded-lg bg-[#f5f5dc]/5" />
        <div className="h-8 w-16 rounded-lg bg-[#f5f5dc]/5" />
      </div>
    </div>
  );
}
