import { Skeleton } from "@/components/ui/skeleton";

export default function TracksLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36 bg-teal-500/10" />
          <Skeleton className="h-4 w-72 bg-teal-500/5" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg bg-teal-500/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-teal-500/5" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-teal-500/5" />
        ))}
      </div>
    </div>
  );
}
