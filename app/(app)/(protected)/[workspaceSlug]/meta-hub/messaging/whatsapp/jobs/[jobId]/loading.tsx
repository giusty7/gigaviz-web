import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 bg-[#d4af37]/10" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl bg-[#d4af37]/10" />
        ))}
      </div>
      <SkeletonCard lines={6} />
    </div>
  );
}
