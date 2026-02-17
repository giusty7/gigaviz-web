import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 bg-cyan-500/10" />
          <Skeleton className="h-4 w-80 bg-cyan-500/5" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg bg-cyan-500/10" />
      </div>
      <Skeleton className="h-64 rounded-xl bg-cyan-500/5" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-cyan-500/5" />
        ))}
      </div>
    </div>
  );
}
