import { Skeleton } from "@/components/ui/skeleton";

export default function NewDashboardLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 bg-purple-500/10" />
        <Skeleton className="h-4 w-64 bg-purple-500/5" />
      </div>
      <div className="space-y-4 rounded-xl border border-purple-500/10 p-6">
        <Skeleton className="h-10 w-full rounded-lg bg-purple-500/5" />
        <Skeleton className="h-20 w-full rounded-lg bg-purple-500/5" />
        <Skeleton className="h-10 w-32 rounded-lg bg-purple-500/10" />
      </div>
    </div>
  );
}
