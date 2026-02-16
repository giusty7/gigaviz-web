import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Workflow,
  ArrowLeft,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { WorkflowActions } from "@/components/studio/WorkflowActions";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string; workflowId: string }>;
};

const statusConfig: Record<string, { icon: typeof Play; color: string; bg: string }> = {
  active: { icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  paused: { icon: Pause, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  draft: { icon: Workflow, color: "text-[#f5f5dc]/40", bg: "bg-[#f5f5dc]/5 border-[#f5f5dc]/10" },
  archived: { icon: XCircle, color: "text-[#f5f5dc]/25", bg: "bg-[#f5f5dc]/5 border-[#f5f5dc]/10" },
};

export default async function WorkflowDetailPage({ params }: PageProps) {
  const { workspaceSlug, workflowId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const t = await getTranslations("studio");
  const db = await supabaseServer();
  const { data: wf, error } = await db
    .from("tracks_workflows")
    .select("*")
    .eq("id", workflowId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .single();

  if (error || !wf) notFound();

  const basePath = `/${workspaceSlug}/modules/studio/tracks`;
  const cfg = statusConfig[wf.status] || statusConfig.draft;
  const StatusIcon = cfg.icon;

  // Fetch recent runs
  const { data: runs } = await db
    .from("tracks_runs")
    .select("id, status, started_at, duration_ms, tokens_used")
    .eq("workflow_id", workflowId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("started_at", { ascending: false })
    .limit(5);

  const recentRuns = runs ?? [];

  return (
    <div className="space-y-6">
      {/* Back + Status */}
      <div className="flex items-center gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("tracks.backLink")}
        </Link>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${cfg.bg} ${cfg.color}`}>
          <StatusIcon className="h-3 w-3" />
          {wf.status}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{wf.title}</h1>
        {wf.description && (
          <p className="mt-1 text-sm text-[#f5f5dc]/50">{wf.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#f5f5dc]/30">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("common.updatedPrefix")}{new Date(wf.updated_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {t("tracks.runsCount", { count: wf.runs_count ?? 0 })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-500/20 bg-[#0a1229]/60 p-4">
          <p className="text-lg font-bold text-[#f5f5dc]">{wf.runs_count ?? 0}</p>
          <p className="text-[10px] text-[#f5f5dc]/40">{t("tracks.detail.totalRuns")}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0a1229]/60 p-4">
          <p className="text-lg font-bold text-emerald-400">{wf.success_count ?? 0}</p>
          <p className="text-[10px] text-[#f5f5dc]/40">{t("tracks.detail.successes")}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-[#0a1229]/60 p-4">
          <p className="text-lg font-bold text-red-400">{wf.failure_count ?? 0}</p>
          <p className="text-[10px] text-[#f5f5dc]/40">{t("tracks.detail.failures")}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-[#0a1229]/60 p-4">
          <p className="text-lg font-bold text-blue-400">{wf.estimated_tokens_per_run ?? "—"}</p>
          <p className="text-[10px] text-[#f5f5dc]/40">{t("tracks.detail.tokensPerRun")}</p>
        </div>
      </div>

      {/* Workflow Configuration */}
      <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
        {wf.steps_json || wf.triggers_json ? (
          <div className="space-y-5">
            {wf.triggers_json && (
              <div>
                <h3 className="text-sm font-semibold text-[#f5f5dc]/60 mb-3">{t("tracks.detail.trigger")}</h3>
                {Array.isArray(wf.triggers_json) ? (
                  <div className="flex flex-wrap gap-2">
                    {(wf.triggers_json as Array<Record<string, unknown>>).map((trigger, i) => (
                      <div key={i} className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-medium text-amber-300">{(trigger.type as string) || (trigger.event as string) || `Trigger ${i + 1}`}</span>
                        {trigger.schedule ? <span className="text-[10px] text-amber-400/50 ml-1">({String(trigger.schedule)})</span> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-300">
                      {typeof wf.triggers_json === "object" && wf.triggers_json !== null
                        ? ((wf.triggers_json as Record<string, unknown>).type as string) || t("tracks.detail.trigger")
                        : t("tracks.detail.trigger")}
                    </span>
                  </div>
                )}
              </div>
            )}
            {wf.steps_json && (
              <div>
                <h3 className="text-sm font-semibold text-[#f5f5dc]/60 mb-3">{t("tracks.detail.steps")}</h3>
                {Array.isArray(wf.steps_json) ? (
                  <div className="space-y-2">
                    {(wf.steps_json as Array<Record<string, unknown>>).map((step, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg bg-[#0a1229]/60 px-4 py-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-bold text-teal-400">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#f5f5dc]/70 truncate">
                            {(step.name as string) || (step.action as string) || (step.type as string) || `Step ${i + 1}`}
                          </p>
                          {step.description ? (
                            <p className="mt-0.5 text-xs text-[#f5f5dc]/40 truncate">{String(step.description)}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-[#0a1229]/60 px-4 py-3">
                    <p className="text-sm text-[#f5f5dc]/70">{t("tracks.detail.steps")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Workflow className="mx-auto mb-3 h-12 w-12 text-teal-400/20" />
            <p className="text-sm text-[#f5f5dc]/40">
              {t("tracks.detail.workflowBuilder")}
            </p>
            <p className="mt-1 text-xs text-[#f5f5dc]/25">
              {t("tracks.detail.builderHint")}
            </p>
          </div>
        )}
      </div>

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider">
            {t("tracks.detail.recentRuns")}
          </h2>
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-3"
              >
                <div className="flex items-center gap-3">
                  {run.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : run.status === "failed" ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <Play className="h-4 w-4 text-blue-400 animate-pulse" />
                  )}
                  <span className="text-xs text-[#f5f5dc]/60">
                    {new Date(run.started_at).toLocaleString()}
                    {run.duration_ms ? ` · ${(run.duration_ms / 1000).toFixed(1)}s` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {run.tokens_used > 0 && (
                    <span className="text-[10px] text-[#f5f5dc]/25">{run.tokens_used} tokens</span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      run.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : run.status === "failed"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`${basePath}/runs`}
            className="mt-2 inline-flex text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
          >
            {t("tracks.viewAllRuns")} →
          </Link>
        </div>
      )}

      {/* Actions */}
      <WorkflowActions
        workflowId={workflowId}
        workspaceSlug={workspaceSlug}
        title={wf.title}
        description={wf.description ?? ""}
        status={wf.status}
      />
    </div>
  );
}
