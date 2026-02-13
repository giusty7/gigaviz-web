import { Skeleton } from "@/components/ui/skeleton";

export default function FullInboxLoading() {
  return (
    <div className="flex h-screen gap-0 bg-[#0a1229]/60 overflow-hidden">
      {/* Thread list */}
      <div className="w-80 border-r border-[#d4af37]/10 p-3 space-y-3">
        <Skeleton className="h-9 w-full rounded-lg bg-[#d4af37]/10" />
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-[#d4af37]/10" />
        ))}
      </div>
      {/* Message area */}
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-14 border-b border-[#d4af37]/10 bg-[#d4af37]/5" />
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-12 rounded-xl bg-[#d4af37]/10 ${i % 2 === 0 ? "w-2/3" : "w-1/2 ml-auto"}`}
            />
          ))}
        </div>
        <Skeleton className="h-14 border-t border-[#d4af37]/10 bg-[#d4af37]/5" />
      </div>
      {/* Contact sidebar */}
      <div className="w-72 border-l border-[#d4af37]/10 p-4 space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto bg-[#d4af37]/10" />
        <Skeleton className="h-5 w-32 mx-auto bg-[#d4af37]/10" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg bg-[#d4af37]/10" />
        ))}
      </div>
    </div>
  );
}
