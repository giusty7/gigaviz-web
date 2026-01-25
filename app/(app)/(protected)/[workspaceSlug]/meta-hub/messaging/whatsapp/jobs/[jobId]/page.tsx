import { redirect } from "next/navigation";
import { JobDetailClient } from "@/components/meta-hub/JobDetailClient";
import { getAppContext } from "@/lib/app-context";

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
