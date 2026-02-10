import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MetaHubConnectionsLoading() {
  return (
    <div className="space-y-8">
      {/* Connection Status Skeleton */}
      <SkeletonCard lines={5} />

      {/* Business Intelligence Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl bg-[#d4af37]/10" />
        ))}
      </div>

      {/* Multi-Platform Connections Skeleton */}
      <SkeletonCard lines={3} />
    </div>
  );
}
