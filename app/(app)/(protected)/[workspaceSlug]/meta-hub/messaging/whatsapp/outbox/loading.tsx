import { Skeleton } from "@/components/ui/skeleton";

export default function OutboxLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-[#d4af37]/10" />
        <Skeleton className="h-9 w-32 rounded-lg bg-[#d4af37]/10" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg bg-[#d4af37]/10" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg bg-[#d4af37]/10" />
        ))}
      </div>
    </div>
  );
}
