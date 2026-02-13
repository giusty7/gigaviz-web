import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import { WorkflowHistoryClient } from "@/components/helper/WorkflowHistoryClient";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("helper");
  return {
    title: `${t("historyTitle")} | Gigaviz Helper`,
    description: t("historyDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function HistoryPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);

  if (!ctx.currentWorkspace || !ctx.user) {
    notFound();
  }

  const workspace = ctx.currentWorkspace;
  const workspaceId = workspace.id;

  // Check entitlement
  const entitlement = await requireEntitlement(workspaceId, "helper");
  if (!entitlement.allowed) {
    const t = await getTranslations("helper");
    return (
      <HelperSubPageShell
        workspaceSlug={workspaceSlug}
        activeTab="history"
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-lg text-[#f5f5dc]/60">{t("disabledMessage")}</p>
        </div>
      </HelperSubPageShell>
    );
  }

  // Load workflow runs
  const db = supabaseAdmin();
  const { data: runs } = await db
    .from("helper_workflow_runs")
    .select(`
      id,
      workflow_id,
      status,
      started_at,
      completed_at,
      output,
      error,
      helper_workflows (
        id,
        name
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("started_at", { ascending: false })
    .limit(50);

  // Transform runs to match client interface
  const t = await getTranslations("helper");
  const transformedRuns = (runs || []).map((run: Record<string, unknown>) => {
    const workflow = run.helper_workflows as { id: string; name: string } | null;
    const startedAt = run.started_at as string;
    const completedAt = run.completed_at as string | null;
    
    return {
      id: run.id as string,
      workflowId: run.workflow_id as string,
      workflowName: workflow?.name || t("unknownWorkflow"),
      status: (run.status || "completed") as "running" | "completed" | "failed" | "cancelled",
      triggeredBy: "manual" as "manual" | "schedule" | "webhook" | "event",
      startedAt,
      completedAt: completedAt || undefined,
      duration: completedAt ? new Date(completedAt).getTime() - new Date(startedAt).getTime() : undefined,
      steps: [], // Would load from run output
      error: run.error as string | undefined,
    };
  });

  return (
    <HelperSubPageShell
      workspaceSlug={workspaceSlug}
      activeTab="history"
    >
      <WorkflowHistoryClient
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        initialRuns={transformedRuns.length > 0 ? transformedRuns : undefined}
      />
    </HelperSubPageShell>
  );
}
