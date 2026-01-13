import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, Users2 } from "lucide-react";
import { WorkspaceRoleManager, type WorkspaceMember } from "@/components/platform/workspace-role-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

type MemberRow = {
  user_id: string;
  role: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export const dynamic = "force-dynamic";

type RolesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function RolesPage({ params }: RolesPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;

  const db = supabaseAdmin();
  const { data: members } = await db
    .from("workspace_members")
    .select("user_id, role, profiles:profiles(full_name, email)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  const memberRows: WorkspaceMember[] = (members as MemberRow[] | null)?.map((row) => ({
    userId: row.user_id,
    role: row.role ?? null,
    email: row.profiles?.email ?? null,
    name: row.profiles?.full_name ?? row.profiles?.email ?? null,
  })) ?? [];

  const canManage = ["owner", "admin"].includes(ctx.currentRole ?? "");

  return (
    <div className="space-y-6">
      <Card className="bg-card/85 border-border/80">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Roles &amp; Access</CardTitle>
            <CardDescription>Assign owner, admin, or member per workspace.</CardDescription>
          </div>
          <Badge variant="outline" className="border-gigaviz-gold/60 text-gigaviz-gold">
            You are {ctx.currentRole ?? "member"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <Guardrail icon={<ShieldCheck className="h-4 w-4" />} title="Owners">
            Full control, billing, and audit enforcement.
          </Guardrail>
          <Guardrail icon={<KeyRound className="h-4 w-4" />} title="Admins">
            Manage members and configuration inside the workspace.
          </Guardrail>
          <Guardrail icon={<Users2 className="h-4 w-4" />} title="Members">
            Least-privilege access to modules scoped by workspace.
          </Guardrail>
        </CardContent>
      </Card>

      <Card className="bg-card/85 border-border/80">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Role changes are audit logged and scoped to this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceRoleManager
            workspaceId={workspace.id}
            canManage={canManage}
            members={memberRows}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Guardrail({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-background px-4 py-3">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gigaviz-surface/70 text-gigaviz-gold">
        {icon}
      </span>
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
