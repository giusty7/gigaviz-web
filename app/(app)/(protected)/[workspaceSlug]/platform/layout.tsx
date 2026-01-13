import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PlatformTabs } from "@/components/platform/platform-tabs";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type PlatformLayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function PlatformLayout({ children, params }: PlatformLayoutProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  if (ctx.currentWorkspace.slug !== workspaceSlug) {
    redirect(`/${ctx.currentWorkspace.slug}/platform`);
  }

  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  const baseHref = `/${ctx.currentWorkspace.slug}/platform`;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-gigaviz-gold">Core OS</p>
            <h1 className="text-2xl font-semibold text-foreground">Gigaviz Platform</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Control center for workspaces, access, audit, and billing. Secure-by-default, workspace scoped.
            </p>
          </div>
          <div className="rounded-2xl border border-gigaviz-gold/30 bg-gigaviz-surface/60 px-4 py-3 text-right text-sm shadow-inner">
            <div className="font-semibold text-foreground">{ctx.currentWorkspace.name}</div>
            <div className="text-xs text-muted-foreground">{ctx.currentWorkspace.slug}</div>
          </div>
        </div>
      </div>

      <PlatformTabs baseHref={baseHref} />

      {children}
    </div>
  );
}

