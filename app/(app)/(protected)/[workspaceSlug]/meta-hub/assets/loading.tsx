import { SkeletonCard, SkeletonCardGrid } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssetsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 bg-[#d4af37]/10" />
      <SkeletonCardGrid count={4} />
      <SkeletonCard lines={4} />
    </div>
  );
}
