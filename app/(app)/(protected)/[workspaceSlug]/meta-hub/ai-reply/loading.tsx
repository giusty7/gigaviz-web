import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AiReplyLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56 bg-[#d4af37]/10" />
      <SkeletonCard lines={5} />
      <SkeletonCard lines={3} />
    </div>
  );
}
