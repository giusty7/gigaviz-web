import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import { AnalyticsClient } from "@/components/helper/AnalyticsClient";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("helper");
  return {
    title: `${t("analyticsTitle")} | Gigaviz Helper`,
    description: t("analyticsDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function AnalyticsPage({ params }: Props) {
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
        activeTab="analytics"
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-lg text-[#f5f5dc]/60">{t("disabledMessage")}</p>
        </div>
      </HelperSubPageShell>
    );
  }

  // Load usage stats (last 30 days)
  const db = supabaseAdmin();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: usageData } = await db
    .from("helper_usage_daily")
    .select("date, tokens_in, tokens_out, requests, provider")
    .eq("workspace_id", workspaceId)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Load conversation stats
  const { data: conversations } = await db
    .from("helper_conversations")
    .select("id, created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Load message counts
  const { count: totalMessages } = await db
    .from("helper_messages")
    .select("id", { count: "exact", head: true })
    .in(
      "conversation_id",
      conversations?.map((c) => c.id) ?? []
    );

  // Load workflow runs
  const { data: workflowRuns } = await db
    .from("helper_workflow_runs")
    .select("id, status, started_at")
    .eq("workspace_id", workspaceId)
    .gte("started_at", thirtyDaysAgo.toISOString());

  return (
    <HelperSubPageShell
      workspaceSlug={workspaceSlug}
      activeTab="analytics"
    >
      <AnalyticsClient
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        usageData={usageData ?? []}
        conversationCount={conversations?.length ?? 0}
        messageCount={totalMessages ?? 0}
        workflowRuns={workflowRuns ?? []}
      />
    </HelperSubPageShell>
  );
}
