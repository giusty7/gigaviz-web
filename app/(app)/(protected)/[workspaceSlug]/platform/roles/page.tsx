import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Crown, KeyRound, ShieldCheck, Users2 } from "lucide-react";
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
      <Card className="bg-[#0a1229]/80 backdrop-blur-xl border border-[#d4af37]/20 shadow-xl">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 border border-[#d4af37]/30">
              <Crown className="h-5 w-5 text-[#d4af37]" />
            </span>
            <div>
              <CardTitle className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">Royal Court</CardTitle>
              <CardDescription className="text-[#f5f5dc]/60">Assign sovereign, steward, or citizen rank per territory.</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-[#d4af37]/60 bg-[#d4af37]/10 text-[#d4af37]">
            You are {ctx.currentRole ?? "member"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <Guardrail icon={<ShieldCheck className="h-4 w-4" />} title="Sovereigns">
            Full control, treasury, and chronicle enforcement.
          </Guardrail>
          <Guardrail icon={<KeyRound className="h-4 w-4" />} title="Stewards">
            Manage citizens and configuration within the territory.
          </Guardrail>
          <Guardrail icon={<Users2 className="h-4 w-4" />} title="Citizens">
            Least-privilege access to modules scoped by realm.
          </Guardrail>
        </CardContent>
      </Card>

      <Card className="bg-[#0a1229]/80 backdrop-blur-xl border border-[#d4af37]/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-[#f5f5dc]">Court Members</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">Rank changes are chronicled and scoped to this territory.</CardDescription>
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
    <div className="flex items-start gap-3 rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 px-4 py-3 transition-all hover:border-[#d4af37]/40">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 text-[#d4af37]">
        {icon}
      </span>
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-[#f5f5dc]">{title}</p>
        <p className="text-xs text-[#f5f5dc]/50 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
