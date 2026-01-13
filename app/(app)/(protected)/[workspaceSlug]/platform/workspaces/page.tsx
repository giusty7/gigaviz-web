import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Building2, ShieldCheck, Users2 } from "lucide-react";
import { WorkspaceCreateDialog } from "@/components/platform/workspace-create-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

type WorkspacesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function PlatformWorkspacesPage({ params }: WorkspacesPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;
  const workspaces = ctx.workspaces;

  return (
    <div className="space-y-6">
      <Card className="bg-card/85 border-border/80">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Workspaces</CardTitle>
            <CardDescription>Each workspace is isolated by data, roles, and billing.</CardDescription>
          </div>
          <WorkspaceCreateDialog />
        </CardHeader>
        <CardContent className="space-y-3">
          {workspaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-6 text-sm text-center">
              <p className="font-semibold text-foreground">No workspaces yet</p>
              <p className="text-xs text-muted-foreground">Create your first workspace to get started.</p>
            </div>
          ) : (
            workspaces.map((ws) => (
              <div
                key={ws.id}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 text-sm shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gigaviz-surface/70 text-gigaviz-gold">
                    <Building2 size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{ws.name}</p>
                    <p className="text-xs text-muted-foreground">{ws.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-border/80 text-xs capitalize">
                    {ws.role || "member"}
                  </Badge>
                  {ws.id === workspace.id ? (
                    <Badge className="bg-emerald-500/15 text-emerald-200">Active</Badge>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/${ws.slug}/platform`} className="inline-flex items-center gap-1">
                        Switch
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/85 border-border/80">
        <CardHeader>
          <CardTitle>Workspace guardrails</CardTitle>
          <CardDescription>Multi-tenant isolation and role-aware controls stay on by default.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {["Workspace-scoped data", "Owner/Admin privileges", "Member least-privilege"].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-border/80 bg-background px-4 py-3 text-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gigaviz-surface/70 text-gigaviz-gold">
                {item.includes("Owner") ? <ShieldCheck className="h-4 w-4" /> : <Users2 className="h-4 w-4" />}
              </span>
              <div>
                <p className="font-semibold text-foreground">{item}</p>
                <p className="text-xs text-muted-foreground">Always filtered by workspace_id and membership.</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

