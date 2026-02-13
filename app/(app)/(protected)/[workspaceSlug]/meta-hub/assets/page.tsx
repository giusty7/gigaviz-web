import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MetaAssetsClient } from "@/components/meta-hub/MetaAssetsClient";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("assetsTitle")} | Meta Hub`,
    description: t("assetsDesc"),
  };
}

export const runtime = "nodejs";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubAssetsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin"].includes(ctx.currentRole ?? "");

  const db = supabaseAdmin();
  const { data: phoneRow } = await db
    .from("wa_phone_numbers")
    .select("waba_id, phone_number_id, display_name")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  return (
    <MetaAssetsClient
      workspaceId={workspaceId}
      canEdit={canEdit}
      wabaId={phoneRow?.waba_id ?? ""}
      phoneNumberId={phoneRow?.phone_number_id ?? ""}
      displayName={phoneRow?.display_name ?? ""}
    />
  );
}
