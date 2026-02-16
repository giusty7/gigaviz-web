import { Skeleton } from "@/components/ui/skeleton";

export default function RunsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36 bg-teal-500/10" />
          <Skeleton className="h-4 w-64 bg-teal-500/5" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-teal-500/5" />
        ))}
      </div>
    </div>
  );
}
