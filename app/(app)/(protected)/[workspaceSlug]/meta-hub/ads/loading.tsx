import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 bg-[#d4af37]/10" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl bg-[#d4af37]/10" />
        ))}
      </div>
      <SkeletonCard lines={4} />
    </div>
  );
}
