import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 rounded-2xl border border-[#d4af37]/10 bg-[#0a1229]/60 overflow-hidden">
      {/* Thread list */}
      <div className="w-80 border-r border-[#d4af37]/10 p-3 space-y-3">
        <Skeleton className="h-9 w-full rounded-lg bg-[#d4af37]/10" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-[#d4af37]/10" />
        ))}
      </div>
      {/* Message area */}
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-14 border-b border-[#d4af37]/10 bg-[#d4af37]/5" />
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-12 rounded-xl bg-[#d4af37]/10 ${i % 2 === 0 ? "w-2/3" : "w-1/2 ml-auto"}`}
            />
          ))}
        </div>
        <Skeleton className="h-14 border-t border-[#d4af37]/10 bg-[#d4af37]/5" />
      </div>
    </div>
  );
}
