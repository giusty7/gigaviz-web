import { Skeleton } from "@/components/ui/skeleton";

export default function OfficeLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44 bg-cyan-500/10" />
          <Skeleton className="h-4 w-72 bg-cyan-500/5" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg bg-cyan-500/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-cyan-500/5" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-cyan-500/5" />
        ))}
      </div>
    </div>
  );
}
