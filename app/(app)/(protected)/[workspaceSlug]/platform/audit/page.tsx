import Link from "next/link";
import { redirect } from "next/navigation";
import { AuditLogPanel } from "@/components/platform/audit-log-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function AuditPage({ params }: AuditPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;

  return (
    <div className="space-y-6">
      <Card className="bg-card/85 border-border/80">
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Every entry is scoped by workspace_id and membership.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            The feed below shows the latest 50 events. Actions like billing requests, feature interest,
            workspace creation, and role updates are logged automatically.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Link href={`/${workspace.slug}/platform/roles`} className="underline hover:text-foreground">
              Change a role
            </Link>
            <span aria-hidden>•</span>
            <Link href={`/${workspace.slug}/platform/billing`} className="underline hover:text-foreground">
              Submit an upgrade request
            </Link>
            <span aria-hidden>•</span>
            <Link href={`/${workspace.slug}/platform/workspaces`} className="underline hover:text-foreground">
              Create a workspace
            </Link>
          </div>
        </CardContent>
      </Card>

      <AuditLogPanel workspaceId={workspace.id} />
    </div>
  );
}

