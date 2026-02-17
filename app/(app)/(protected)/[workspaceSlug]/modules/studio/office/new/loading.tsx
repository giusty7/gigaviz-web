import { Skeleton } from "@/components/ui/skeleton";

export default function NewDocumentLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 bg-cyan-500/10" />
        <Skeleton className="h-4 w-64 bg-cyan-500/5" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 rounded-lg bg-cyan-500/5" />
        <Skeleton className="h-10 rounded-lg bg-cyan-500/5" />
        <Skeleton className="h-24 rounded-lg bg-cyan-500/5" />
        <Skeleton className="h-10 w-36 rounded-lg bg-cyan-500/10" />
      </div>
    </div>
  );
}
