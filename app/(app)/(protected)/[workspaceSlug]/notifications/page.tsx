import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { NotificationsClient } from "@/components/app/notifications-client";

export const dynamic = "force-dynamic";

type NotificationsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage all your workspace notifications in one place.
        </p>
      </div>

      <NotificationsClient
        workspaceId={ctx.currentWorkspace.id}
        workspaceSlug={ctx.currentWorkspace.slug}
      />
    </div>
  );
}
