import { Loader2 } from "lucide-react";
export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        <p className="text-sm text-slate-400">Loading marketplace...</p>
      </div>
    </div>
  );
}
