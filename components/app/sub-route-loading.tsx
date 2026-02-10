import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic loading skeleton for workspace sub-routes.
 * Re-exported by individual loading.tsx files for consistent UX.
 */
export default function SubRouteLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-[#d4af37]/10" />
        <Skeleton className="h-4 w-96 bg-[#d4af37]/10" />
      </div>

      {/* Content Card */}
      <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 bg-[#d4af37]/10" />
          <Skeleton className="h-9 w-28 rounded-lg bg-[#d4af37]/10" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg bg-[#d4af37]/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full bg-[#d4af37]/10" />
                <Skeleton className="h-3 w-2/3 bg-[#d4af37]/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
