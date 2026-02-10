import { SkeletonCardGrid, SkeletonList } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformLoading() {
  return (
    <div className="relative space-y-6">
      {/* Page Header Skeleton */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-10 w-10 rounded-xl bg-[#d4af37]/10" />
          <Skeleton className="h-5 w-32 rounded-full bg-[#10b981]/10" />
        </div>
        <Skeleton className="h-8 w-64 bg-[#d4af37]/10" />
        <Skeleton className="mt-2 h-4 w-96 bg-[#d4af37]/10" />
      </div>

      {/* Onboarding Panel Skeleton */}
      <Skeleton className="h-24 w-full rounded-2xl bg-[#d4af37]/10" />

      {/* Summary Cards */}
      <SkeletonCardGrid count={4} />

      {/* Quick Actions */}
      <Skeleton className="h-48 w-full rounded-2xl bg-[#d4af37]/10" />

      {/* Checklist + Audit */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-64 rounded-2xl bg-[#d4af37]/10" />
        <SkeletonList rows={4} />
      </div>
    </div>
  );
}
