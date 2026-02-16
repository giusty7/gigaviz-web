import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 bg-purple-500/10" />
          <Skeleton className="h-4 w-64 bg-purple-500/5" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg bg-purple-500/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl bg-purple-500/5" />
        ))}
      </div>
    </div>
  );
}
