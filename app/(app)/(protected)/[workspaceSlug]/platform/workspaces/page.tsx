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
      <Card className="bg-[#0a1229]/80 backdrop-blur-xl border border-[#d4af37]/20 shadow-xl">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 border border-[#d4af37]/30">
              <Building2 className="h-5 w-5 text-[#d4af37]" />
            </span>
            <div>
              <CardTitle className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">Imperial Territories</CardTitle>
              <CardDescription className="text-[#f5f5dc]/60">Each workspace is an isolated realm with sovereign data, roles, and treasury.</CardDescription>
            </div>
          </div>
          <WorkspaceCreateDialog />
        </CardHeader>
        <CardContent className="space-y-3">
          {workspaces.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#d4af37]/30 bg-[#050a18]/60 px-6 py-10 text-center">
              <div className="absolute inset-0 batik-pattern opacity-[0.04]" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30">
                  <Building2 className="h-8 w-8 text-[#d4af37]/60" />
                </div>
                <p className="text-lg font-semibold bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">Awaiting Sovereignty</p>
                <p className="mt-1 text-sm text-[#f5f5dc]/50">Create your first territory to begin your reign.</p>
              </div>
            </div>
          ) : (
            workspaces.map((ws) => (
              <div
                key={ws.id}
                className="group flex items-center justify-between rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 px-4 py-3 text-sm shadow-sm transition-all hover:border-[#d4af37]/40 hover:bg-[#0a1229]/80"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 text-[#d4af37]">
                    <Building2 size={16} />
                  </span>
                  <div>
                    <p className="font-semibold text-[#f5f5dc]">{ws.name}</p>
                    <p className="text-xs text-[#f5f5dc]/50">{ws.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-[#d4af37]/40 text-[#d4af37] text-xs capitalize">
                    {ws.role || "member"}
                  </Badge>
                  {ws.id === workspace.id ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Active</Badge>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37]/50">
                      <Link href={`/${ws.slug}/platform`} className="inline-flex items-center gap-1">
                        Switch
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#0a1229]/80 backdrop-blur-xl border border-[#d4af37]/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-[#f5f5dc]">Sovereign Guardrails</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">Multi-tenant isolation and role-aware controls protect every realm.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {["Workspace-scoped data", "Owner/Admin privileges", "Member least-privilege"].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 px-4 py-3 text-sm transition-all hover:border-[#d4af37]/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 text-[#d4af37]">
                {item.includes("Owner") ? <ShieldCheck className="h-4 w-4" /> : <Users2 className="h-4 w-4" />}
              </span>
              <div>
                <p className="font-semibold text-[#f5f5dc]">{item}</p>
                <p className="text-xs text-[#f5f5dc]/50">Always filtered by workspace_id and membership.</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

