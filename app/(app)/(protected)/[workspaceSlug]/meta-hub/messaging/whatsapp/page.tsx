import { redirect } from "next/navigation";
import { WhatsappTemplatesClient } from "@/components/meta-hub/WhatsappTemplatesClient";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

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
  const supabase = await supabaseServer();
  const { data: settings } = await supabase
    .from("wa_settings")
    .select("sandbox_enabled, test_whitelist")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const { data: connections } = await supabaseAdmin()
    .from("wa_phone_numbers")
    .select("id, phone_number_id, waba_id, display_name, status")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  return (
    <WhatsappTemplatesClient
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      canEdit={canEdit}
      templates={[]}
      connections={connections ?? []}
      sandboxEnabled={settings?.sandbox_enabled ?? true}
      whitelist={Array.isArray(settings?.test_whitelist) ? settings?.test_whitelist : []}
    />
  );
}

