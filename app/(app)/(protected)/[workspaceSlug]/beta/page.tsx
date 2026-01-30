import { redirect } from "next/navigation";
import { BetaProgramsClient } from "@/components/platform/BetaProgramsClient";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function BetaProgramsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/beta`);
  }

  await ensureWorkspaceCookie(workspace.id);

  return (
    <div className="space-y-6">
      <BetaProgramsClient workspaceId={workspace.id} />
    </div>
  );
}
