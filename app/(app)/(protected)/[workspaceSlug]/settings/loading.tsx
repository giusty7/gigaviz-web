import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-[#d4af37]/10" />
        <Skeleton className="h-4 w-96 bg-[#d4af37]/10" />
      </div>

      {/* Workspace Settings Card */}
      <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 space-y-4">
        <Skeleton className="h-6 w-40 bg-[#d4af37]/10" />
        <Skeleton className="h-10 w-full bg-[#d4af37]/10" />
        <Skeleton className="h-10 w-full bg-[#d4af37]/10" />
        <Skeleton className="h-10 w-32 bg-[#d4af37]/10" />
      </div>

      {/* Members Card */}
      <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 space-y-4">
        <Skeleton className="h-6 w-32 bg-[#d4af37]/10" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full bg-[#d4af37]/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 bg-[#d4af37]/10" />
              <Skeleton className="h-3 w-56 bg-[#d4af37]/10" />
            </div>
            <Skeleton className="h-8 w-20 bg-[#d4af37]/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
