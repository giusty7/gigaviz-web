import { SkeletonCard, SkeletonCardGrid } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MetaHubLoading() {
  return (
    <div className="space-y-6">
      {/* Status Card Skeleton */}
      <SkeletonCard lines={4} />

      {/* Channel Grid Skeleton */}
      <SkeletonCardGrid count={4} />

      {/* Overview Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl bg-[#d4af37]/10" />
        <Skeleton className="h-64 rounded-2xl bg-[#d4af37]/10" />
      </div>
    </div>
  );
}
