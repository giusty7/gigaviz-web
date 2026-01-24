import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type ModulesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function ModulesPage({ params }: ModulesPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;

  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/products`);
  }

  await ensureWorkspaceCookie(workspace.id);

  redirect(`/${workspace.slug}/products`);
}

