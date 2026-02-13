import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JobsListClient } from "@/components/meta-hub/JobsListClient";
import { getAppContext } from "@/lib/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("jobsTitle")} | Meta Hub`,
    description: t("jobsDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function JobsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold">Send Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Track batch campaigns and monitor delivery progress. Jobs are processed automatically every few minutes.
          </p>
        </div>

        <JobsListClient
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </div>
  );
}
