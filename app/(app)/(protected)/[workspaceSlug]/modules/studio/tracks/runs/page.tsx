import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HistoryIcon,
  CheckCircle2,
  XCircle,
  Play,
  Clock,
  Zap,
  ArrowLeft,
} from "lucide-react";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TracksRunHistoryPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = supabaseAdmin();

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const plan = getPlanMeta(sub?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const ents = ctx.effectiveEntitlements ?? [];
  const hasAccess = canAccess(
    { plan_id: plan.plan_id, is_admin: isAdmin, effectiveEntitlements: ents },
    "tracks"
  );

  if (!hasAccess) {
    return (
      <LockedScreen title="Run History is locked" workspaceSlug={workspaceSlug} />
    );
  }

  const { data: runs } = await db
    .from("tracks_runs")
    .select("id, status, current_step, tokens_used, started_at, completed_at, duration_ms, error_message, workflow_id")
    .eq("workspace_id", workspace.id)
    .order("started_at", { ascending: false })
    .limit(50);

  const items = runs ?? [];
  const basePath = `/${workspaceSlug}/modules/studio/tracks`;

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-red-400" />;
    if (status === "running") return <Play className="h-4 w-4 text-blue-400 animate-pulse" />;
    return <Clock className="h-4 w-4 text-[#f5f5dc]/30" />;
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-emerald-500/10 text-emerald-400";
    if (status === "failed") return "bg-red-500/10 text-red-400";
    if (status === "running") return "bg-blue-500/10 text-blue-400";
    return "bg-[#f5f5dc]/5 text-[#f5f5dc]/40";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Workflows
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">Run History</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/50">
          View execution history, status, duration, and token usage for all workflow runs.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-teal-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <HistoryIcon className="h-6 w-6 text-teal-400" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">{items.length}</p>
              <p className="text-[10px] text-[#f5f5dc]/40">Total Runs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">
                {items.filter((r) => r.status === "completed").length}
              </p>
              <p className="text-[10px] text-[#f5f5dc]/40">Completed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-blue-400" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">
                {items.reduce((acc, r) => acc + (r.tokens_used ?? 0), 0)}
              </p>
              <p className="text-[10px] text-[#f5f5dc]/40">Tokens Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Runs List */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-4 transition-all hover:border-teal-500/10"
            >
              <div className="flex items-center gap-3">
                {statusIcon(run.status)}
                <div>
                  <p className="text-sm font-medium text-[#f5f5dc]">
                    Run {run.id.slice(0, 8)}
                  </p>
                  <p className="text-[10px] text-[#f5f5dc]/25">
                    {new Date(run.started_at).toLocaleString()}
                    {run.duration_ms ? ` · ${(run.duration_ms / 1000).toFixed(1)}s` : ""}
                    {run.current_step ? ` · Step: ${run.current_step}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {run.tokens_used > 0 && (
                  <span className="text-[10px] text-[#f5f5dc]/25">
                    {run.tokens_used} tokens
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${statusColor(run.status)}`}>
                  {run.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 text-center">
          <HistoryIcon className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
          <p className="text-sm font-medium text-[#f5f5dc]/40">No runs yet</p>
          <p className="mt-1 text-xs text-[#f5f5dc]/25">
            Activate a workflow to see execution history here.
          </p>
        </div>
      )}
    </div>
  );
}
