import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WhatsAppWebhooksLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 bg-[#d4af37]/10" />
      <SkeletonCard lines={4} />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg bg-[#d4af37]/10" />
        ))}
      </div>
    </div>
  );
}
