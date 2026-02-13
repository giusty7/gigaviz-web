import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import { KnowledgeBaseClient } from "@/components/helper/KnowledgeBaseClient";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("helper");
  return {
    title: `${t("knowledgeTitle")} | Gigaviz Helper`,
    description: t("knowledgeDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function KnowledgeBasePage({ params }: Props) {
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
        activeTab="knowledge"
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-lg text-[#f5f5dc]/60">{t("disabledMessage")}</p>
        </div>
      </HelperSubPageShell>
    );
  }

  // Load existing knowledge sources
  const db = supabaseAdmin();
  const { data: sources } = await db
    .from("helper_knowledge_sources")
    .select("id, source_type, source_id, title, content_text, metadata, indexed_at, is_active, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <HelperSubPageShell
      workspaceSlug={workspaceSlug}
      activeTab="knowledge"
    >
      <KnowledgeBaseClient
        workspaceId={workspaceId}
        initialSources={sources ?? []}
      />
    </HelperSubPageShell>
  );
}
