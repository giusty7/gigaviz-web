import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reusable skeleton card for Suspense fallbacks.
 * Renders a shimmering placeholder matching the imperium card style.
 */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const widths = ["w-3/4", "w-3/5", "w-1/2", "w-2/5", "w-1/3"];
  return (
    <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl">
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3 bg-[#d4af37]/10" />
        <Skeleton className="h-8 w-2/5 bg-[#d4af37]/10" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-3 bg-[#d4af37]/10 ${widths[i % widths.length]}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards — useful for summary card sections.
 */
export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a list of items (audit events, activity feed, etc.).
 */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[#d4af37]/15 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 bg-[#d4af37]/10" />
            <Skeleton className="h-3 w-2/5 bg-[#d4af37]/10" />
          </div>
          <Skeleton className="h-3 w-16 bg-[#d4af37]/10" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full-section skeleton with title + card grid — for Suspense fallbacks
 * in pages that have labeled sections.
 */
export function SkeletonSection({ title }: { title?: string }) {
  return (
    <div className="space-y-4">
      {title && <Skeleton className="h-5 w-40 bg-[#d4af37]/10" />}
      <SkeletonCardGrid count={4} />
    </div>
  );
}
