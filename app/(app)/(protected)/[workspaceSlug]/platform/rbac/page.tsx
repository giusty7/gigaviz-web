import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

type RBACPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function RBACPage({ params }: RBACPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  redirect(`/${ctx.currentWorkspace.slug}/platform/roles`);
}
