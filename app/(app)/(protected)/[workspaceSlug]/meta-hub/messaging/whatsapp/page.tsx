import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ImperiumTemplateForgeClient } from "@/components/meta-hub/ImperiumTemplateForgeClient";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("whatsappTitle")} | Meta Hub`,
    description: t("whatsappDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MetaHubWhatsappPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin"].includes(ctx.currentRole ?? "");
  
  const { data: connections } = await supabaseAdmin()
    .from("wa_phone_numbers")
    .select("id, phone_number_id, waba_id, display_name, status")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  // Fetch initial templates for first connection
  const activeConnection = connections?.find((c) => c.status?.toLowerCase() === "active") ?? connections?.[0];
  const { data: templates } = activeConnection
    ? await supabaseAdmin()
        .from("wa_templates")
        .select("id, name, language, status, category, quality_score, rejection_reason, phone_number_id, meta_template_id, body, header, footer, buttons, last_synced_at, variable_count, workspace_id, components_json, has_buttons")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <ImperiumTemplateForgeClient
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      canEdit={canEdit}
      initialTemplates={templates ?? []}
      connections={connections ?? []}
    />
  );
}

