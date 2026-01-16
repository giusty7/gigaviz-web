import Link from "next/link";
import { redirect } from "next/navigation";
import { Scroll } from "lucide-react";
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
      <Card className="bg-[#0a1229]/80 backdrop-blur-xl border border-[#d4af37]/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 border border-[#d4af37]/30">
              <Scroll className="h-5 w-5 text-[#d4af37]" />
            </span>
            <div>
              <CardTitle className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">Imperial Chronicles</CardTitle>
              <CardDescription className="text-[#f5f5dc]/60">Every decree is etched by workspace_id and membership.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-[#f5f5dc]/70">
            The scrolls below reveal the latest 50 imperial events. Actions like treasury requests, feature interest,
            territory creation, and rank updates are chronicled automatically.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-[#f5f5dc]/50">
            <Link href={`/${workspace.slug}/platform/roles`} className="underline hover:text-[#d4af37] transition-colors">
              Change a rank
            </Link>
            <span aria-hidden className="text-[#d4af37]/40">•</span>
            <Link href={`/${workspace.slug}/platform/billing`} className="underline hover:text-[#d4af37] transition-colors">
              Submit a treasury request
            </Link>
            <span aria-hidden className="text-[#d4af37]/40">•</span>
            <Link href={`/${workspace.slug}/platform/workspaces`} className="underline hover:text-[#d4af37] transition-colors">
              Create a territory
            </Link>
          </div>
        </CardContent>
      </Card>

      <AuditLogPanel workspaceId={workspace.id} />
    </div>
  );
}

