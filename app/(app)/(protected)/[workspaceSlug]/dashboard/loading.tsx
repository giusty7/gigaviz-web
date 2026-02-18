import { SkeletonCardGrid, SkeletonList } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="relative space-y-8 pb-12">
      {/* Hero Section Skeleton */}
      <div className="rounded-3xl border border-accent/30 bg-gradient-to-br from-gigaviz-surface/90 via-gigaviz-surface/80 to-gigaviz-surface/90 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 bg-accent/10" />
              <Skeleton className="h-8 w-full max-w-[18rem] bg-accent/10" />
            </div>
            <Skeleton className="h-5 w-full max-w-[24rem] bg-accent/10" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl bg-accent/10 shrink-0" />
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <SkeletonCardGrid count={4} />
      <SkeletonCardGrid count={4} />

      {/* Activity + Updates */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 bg-accent/10" />
          <SkeletonList rows={5} />
        </div>
        <Skeleton className="h-80 rounded-2xl bg-accent/10" />
      </div>
    </div>
  );
}
