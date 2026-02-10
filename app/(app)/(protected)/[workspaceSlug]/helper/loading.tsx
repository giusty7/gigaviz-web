import { Skeleton } from "@/components/ui/skeleton";

export default function HelperLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar Skeleton */}
      <div className="w-72 space-y-3 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-4">
        <Skeleton className="h-10 w-full rounded-lg bg-[#d4af37]/10" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg bg-[#d4af37]/10" />
          ))}
        </div>
      </div>

      {/* Chat Area Skeleton */}
      <div className="flex-1 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6">
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full bg-[#d4af37]/10" />
          <Skeleton className="h-6 w-48 bg-[#d4af37]/10" />
          <Skeleton className="h-4 w-64 bg-[#d4af37]/10" />
        </div>
      </div>
    </div>
  );
}
