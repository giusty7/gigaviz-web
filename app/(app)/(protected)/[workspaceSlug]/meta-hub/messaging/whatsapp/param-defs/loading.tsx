import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParamDefsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56 bg-[#d4af37]/10" />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  );
}
