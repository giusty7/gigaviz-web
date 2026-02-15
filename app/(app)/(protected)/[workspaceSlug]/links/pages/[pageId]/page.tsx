import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { supabaseServer } from "@/lib/supabase/server";
import { LinkPageEditor } from "@/components/links/LinkPageEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ workspaceSlug: string; pageId: string }> };

export default async function EditLinkPageRoute({ params }: Props) {
  const { workspaceSlug, pageId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "links");
  const db = await supabaseServer();

  const { data: page } = await db
    .from("link_pages")
    .select("*")
    .eq("id", pageId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .single();

  if (!page) redirect(`/${workspaceSlug}/links`);

  const { data: items } = await db
    .from("link_items")
    .select("*")
    .eq("page_id", pageId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("sort_order", { ascending: true });

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <LinkPageEditor
        workspaceSlug={workspaceSlug}
        page={page}
        items={items ?? []}
      />
    </FeatureGate>
  );
}
