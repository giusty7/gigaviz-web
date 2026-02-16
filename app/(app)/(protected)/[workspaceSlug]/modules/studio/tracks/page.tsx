import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
} from "lucide-react";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

const statusConfig: Record<string, { icon: typeof Play; color: string; bg: string }> = {
  active: { icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  paused: { icon: Pause, color: "text-amber-400", bg: "bg-amber-500/10" },
  draft: { icon: Workflow, color: "text-[#f5f5dc]/40", bg: "bg-[#f5f5dc]/5" },
  archived: { icon: XCircle, color: "text-[#f5f5dc]/25", bg: "bg-[#f5f5dc]/5" },
};

export default async function TracksWorkflowsPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const t = await getTranslations("studio");
  const db = await supabaseServer();

  // Entitlement check
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
      <LockedScreen
        title={t("tracks.lockedTitle")}
        description={t("tracks.lockedDescription")}
        workspaceSlug={workspaceSlug}
      />
    );
  }

  // Fetch workflows
  const { data: workflows } = await db
    .from("tracks_workflows")
    .select("id, title, slug, description, status, runs_count, success_count, failure_count, estimated_tokens_per_run, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  const items = workflows ?? [];
  const activeCount = items.filter((w) => w.status === "active").length;
  const totalRuns = items.reduce((acc, w) => acc + (w.runs_count ?? 0), 0);
  const totalSuccess = items.reduce((acc, w) => acc + (w.success_count ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5dc]">{t("tracks.title")}</h1>
          <p className="mt-1 text-sm text-[#f5f5dc]/50">
            {t("tracks.description")}
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/modules/studio/tracks/new`}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("tracks.newWorkflow")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Workflow className="h-6 w-6 text-teal-400" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">{items.length}</p>
              <p className="text-[10px] text-[#f5f5dc]/40">{t("tracks.stats.total")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Play className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">{activeCount}</p>
              <p className="text-[10px] text-[#f5f5dc]/40">{t("tracks.stats.active")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-blue-400" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">{totalRuns}</p>
              <p className="text-[10px] text-[#f5f5dc]/40">{t("tracks.stats.totalRuns")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-[#f5f5dc]">
                {totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0}%
              </p>
              <p className="text-[10px] text-[#f5f5dc]/40">{t("tracks.stats.successRate")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow List */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider">
          {t("tracks.yourWorkflows")}
        </h2>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((wf) => {
              const cfg = statusConfig[wf.status] || statusConfig.draft;
              const StatusIcon = cfg.icon;
              return (
                <Link
                  key={wf.id}
                  href={`/${workspaceSlug}/modules/studio/tracks/${wf.id}`}
                  className="group flex items-center justify-between rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5 transition-all hover:border-teal-500/20 hover:bg-[#0a1229]/60"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.bg}`}>
                      <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#f5f5dc] group-hover:text-teal-300 transition-colors">
                        {wf.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-[#f5f5dc]/30">
                        <span>{t("tracks.runsCount", { count: wf.runs_count ?? 0 })}</span>
                        <span className="flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                          {wf.success_count ?? 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <XCircle className="h-2.5 w-2.5 text-red-500" />
                          {wf.failure_count ?? 0}
                        </span>
                        {wf.estimated_tokens_per_run && (
                          <span>~{t("tracks.tokensPerRun", { count: wf.estimated_tokens_per_run })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-[#f5f5dc]/20">
                      <Clock className="h-3 w-3" />
                      {new Date(wf.updated_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${cfg.bg} ${cfg.color}`}
                    >
                      {wf.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 text-center">
            <Workflow className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
            <p className="text-sm font-medium text-[#f5f5dc]/40">{t("tracks.emptyTitle")}</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/25">
              {t("tracks.emptyDescription")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
