import { Skeleton } from "@/components/ui/skeleton";

export default function WorkflowDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-24 rounded-lg bg-teal-500/10" />
        <Skeleton className="h-6 w-16 rounded-full bg-teal-500/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 bg-teal-500/10" />
        <Skeleton className="h-4 w-40 bg-teal-500/5" />
      </div>
      <Skeleton className="h-9 w-40 rounded-lg bg-teal-500/10" />
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-teal-500/5" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl bg-teal-500/5" />
    </div>
  );
}
