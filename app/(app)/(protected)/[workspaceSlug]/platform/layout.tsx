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
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Gigaviz Platform — Core OS</h1>
        <p className="text-sm text-muted-foreground">
          Akun, workspace, peran, audit, dan billing dalam satu tempat.
        </p>
      </div>
      <PlatformTabs baseHref={baseHref} />
      {children}
    </div>
  );
}

