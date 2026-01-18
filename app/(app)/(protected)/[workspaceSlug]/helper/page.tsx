import { redirect } from "next/navigation";
import { ImperiumHelperClient } from "@/components/helper/ImperiumHelperClient";
import { FeatureGate } from "@/components/gates/feature-gate";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function HelperPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = supabaseAdmin();

  const entitlement = await requireEntitlement(workspace.id, "helper");

  const { data: conversations } = await db
    .from("helper_conversations")
    .select("id, title, created_at, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <ImperiumHelperClient
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        workspaceName={workspace.name}
        initialConversations={conversations ?? []}
      />
    </FeatureGate>
  );
}
