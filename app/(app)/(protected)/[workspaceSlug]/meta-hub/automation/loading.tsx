import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AutomationLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56 bg-[#d4af37]/10" />
      <SkeletonCard lines={3} />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-[#d4af37]/10" />
        ))}
      </div>
    </div>
  );
}
