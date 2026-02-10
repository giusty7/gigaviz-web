import { SkeletonList } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Thread List Skeleton */}
      <div className="w-80 space-y-2 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-3">
        <Skeleton className="h-10 w-full rounded-lg bg-[#d4af37]/10" />
        <SkeletonList rows={8} />
      </div>

      {/* Message Area Skeleton */}
      <div className="flex-1 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6">
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full bg-[#d4af37]/10" />
          <Skeleton className="h-5 w-40 bg-[#d4af37]/10" />
          <Skeleton className="h-4 w-56 bg-[#d4af37]/10" />
        </div>
      </div>
    </div>
  );
}
