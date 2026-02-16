import { Skeleton } from "@/components/ui/skeleton";

export default function ChartDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-20 rounded-lg bg-purple-500/10" />
        <Skeleton className="h-6 w-16 rounded-full bg-purple-500/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 bg-purple-500/10" />
        <Skeleton className="h-4 w-48 bg-purple-500/5" />
      </div>
      <Skeleton className="h-9 w-32 rounded-lg bg-purple-500/10" />
      <Skeleton className="h-48 w-full rounded-xl bg-purple-500/5" />
    </div>
  );
}
