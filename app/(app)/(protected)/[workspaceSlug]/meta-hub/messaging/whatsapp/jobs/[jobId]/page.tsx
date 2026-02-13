import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JobDetailClient } from "@/components/meta-hub/JobDetailClient";
import { getAppContext } from "@/lib/app-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("jobDetailTitle")} | Meta Hub`,
    description: t("jobDetailDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string; jobId: string }>;
};

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: Props) {
  const { workspaceSlug, jobId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;

  return (
    <div className="space-y-6">
      <JobDetailClient
        workspaceId={workspaceId}
        jobId={jobId}
      />
    </div>
  );
}
