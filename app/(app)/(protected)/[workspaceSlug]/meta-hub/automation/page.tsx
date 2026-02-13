import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AutomationRulesManager } from "@/components/meta-hub/AutomationRulesManager";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("automationTitle")} | Meta Hub`,
    description: t("automationDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MetaHubAutomationPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub/automation`);
  }

  await ensureWorkspaceCookie(workspace.id);

  return (
    <div className="space-y-6">
      <AutomationRulesManager
        workspaceId={workspace.id}
      />
    </div>
  );
}
