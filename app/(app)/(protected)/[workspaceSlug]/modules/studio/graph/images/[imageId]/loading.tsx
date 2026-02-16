import { Skeleton } from "@/components/ui/skeleton";

export default function ImageDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-24 rounded-lg bg-purple-500/10" />
        <Skeleton className="h-5 w-28 rounded-full bg-purple-500/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 bg-purple-500/10" />
        <Skeleton className="h-4 w-48 bg-purple-500/5" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl bg-purple-500/5" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-28 rounded-lg bg-purple-500/10" />
        <Skeleton className="h-9 w-24 rounded-lg bg-purple-500/5" />
      </div>
    </div>
  );
}
