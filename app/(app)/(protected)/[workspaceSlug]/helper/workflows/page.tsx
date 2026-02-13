import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import { WorkflowsClient } from "@/components/helper/WorkflowsClient";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("helper");
  return {
    title: `${t("workflowsTitle")} | Gigaviz Helper`,
    description: t("workflowsDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WorkflowsPage({ params }: Props) {
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
        activeTab="workflows"
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-lg text-[#f5f5dc]/60">{t("disabledMessage")}</p>
        </div>
      </HelperSubPageShell>
    );
  }

  // Load existing workflows
  const db = supabaseAdmin();
  const { data: workflows } = await db
    .from("helper_workflows")
    .select("id, name, description, trigger_type, trigger_config, steps, is_active, run_count, last_run_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <HelperSubPageShell
      workspaceSlug={workspaceSlug}
      activeTab="workflows"
    >
      <WorkflowsClient
        workspaceId={workspaceId}
        initialWorkflows={workflows ?? []}
      />
    </HelperSubPageShell>
  );
}
