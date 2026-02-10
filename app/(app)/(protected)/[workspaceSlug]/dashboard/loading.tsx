import { SkeletonCardGrid, SkeletonList } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="relative space-y-8 pb-12">
      {/* Hero Section Skeleton */}
      <div className="rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#0a1229]/90 via-[#0a1229]/80 to-[#0a1229]/90 p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 bg-[#d4af37]/10" />
              <Skeleton className="h-8 w-72 bg-[#d4af37]/10" />
            </div>
            <Skeleton className="h-5 w-96 bg-[#d4af37]/10" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl bg-[#d4af37]/10" />
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <SkeletonCardGrid count={4} />
      <SkeletonCardGrid count={4} />

      {/* Activity + Updates */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 bg-[#d4af37]/10" />
          <SkeletonList rows={5} />
        </div>
        <Skeleton className="h-80 rounded-2xl bg-[#d4af37]/10" />
      </div>
    </div>
  );
}
