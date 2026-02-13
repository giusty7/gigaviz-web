import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MetaHubAnalyticsDashboard } from "@/components/meta-hub/MetaHubAnalyticsDashboard";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("insightsTitle")} | Meta Hub`,
    description: t("insightsDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubInsightsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub/insights`);
  }

  await ensureWorkspaceCookie(workspace.id);

  return (
    <div className="space-y-6">
      <MetaHubAnalyticsDashboard
        workspaceId={workspace.id}
      />
    </div>
  );
}
