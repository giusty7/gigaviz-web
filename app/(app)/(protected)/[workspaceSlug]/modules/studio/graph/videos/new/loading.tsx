import { Skeleton } from "@/components/ui/skeleton";

export default function NewVideoLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40 bg-purple-500/10" />
        <Skeleton className="h-4 w-64 bg-purple-500/5" />
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-purple-500/5" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg bg-purple-500/5" />
      <Skeleton className="h-24 w-full rounded-lg bg-purple-500/5" />
      <Skeleton className="h-10 w-32 rounded-lg bg-purple-500/10" />
    </div>
  );
}
