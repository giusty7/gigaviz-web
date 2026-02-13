import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 bg-[#d4af37]/10" />
      <SkeletonCard lines={6} />
      <SkeletonCard lines={4} />
    </div>
  );
}
