import { redirect } from "next/navigation";
import { HelperClient } from "@/components/helper/HelperClient";
import { getAppContext } from "@/lib/app-context";
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

  const { data: conversations } = await db
    .from("helper_conversations")
    .select("id, title, created_at, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Gigaviz Helper</p>
          <h1 className="text-2xl font-bold">AI assistant for chat, copy, and summaries</h1>
        </div>
      </div>

      <HelperClient
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        workspaceName={workspace.name}
        initialConversations={conversations ?? []}
      />
    </div>
  );
}
