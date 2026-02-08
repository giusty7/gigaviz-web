import { Loader2 } from "lucide-react";

export default function OpsLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <p className="text-sm text-slate-400">Loading ops console...</p>
      </div>
    </div>
  );
}
