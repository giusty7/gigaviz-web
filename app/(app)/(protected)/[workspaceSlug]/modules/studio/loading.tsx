import { Skeleton } from "@/components/ui/skeleton";

export default function StudioLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-cyan-500/10" />
        <Skeleton className="h-4 w-96 bg-cyan-500/5" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-cyan-500/10 bg-[#0a1229]/60 p-6 space-y-4"
          >
            <Skeleton className="h-12 w-12 rounded-xl bg-cyan-500/10" />
            <Skeleton className="h-5 w-32 bg-cyan-500/10" />
            <Skeleton className="h-4 w-full bg-cyan-500/5" />
            <Skeleton className="h-4 w-3/4 bg-cyan-500/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full bg-cyan-500/5" />
              <Skeleton className="h-6 w-16 rounded-full bg-cyan-500/5" />
            </div>
          </div>
        ))}
      </div>

      {/* Integration section skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 bg-cyan-500/10" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24 rounded-xl bg-cyan-500/5" />
          <Skeleton className="h-24 rounded-xl bg-cyan-500/5" />
        </div>
      </div>
    </div>
  );
}
