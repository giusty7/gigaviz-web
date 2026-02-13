import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import { AIStudioClient } from "@/components/helper/AIStudioClient";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("helper");
  return {
    title: `${t("aiStudioTitle")} | Gigaviz Helper`,
    description: t("aiStudioDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function AIStudioPage({ params }: Props) {
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
      <HelperSubPageShell workspaceSlug={workspaceSlug} activeTab="ai">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-lg text-[#f5f5dc]/60">{t("disabledMessage")}</p>
        </div>
      </HelperSubPageShell>
    );
  }

  // Load AI settings and templates
  const db = supabaseAdmin();
  
  const [settingsResult, templatesResult] = await Promise.all([
    db
      .from("helper_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single(),
    db
      .from("helper_templates")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const settings = settingsResult.data;
  const templates = templatesResult.data ?? [];

  return (
    <HelperSubPageShell workspaceSlug={workspaceSlug} activeTab="ai">
      <AIStudioClient
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        initialSettings={settings}
        initialTemplates={templates}
      />
    </HelperSubPageShell>
  );
}
