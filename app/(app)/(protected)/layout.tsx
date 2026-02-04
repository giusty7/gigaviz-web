import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AppShell from "@/components/app/AppShell";
import { getAppContext, getAppContextImpersonated } from "@/lib/app-context";
import { getImpersonationContext } from "@/lib/impersonation/context";
import { isPlatformAdminById } from "@/lib/platform-admin/server";

export const dynamic = "force-dynamic";

type AppLayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug?: string }>;
};

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const resolvedParams = await params;
  const impersonation = await getImpersonationContext();

  const ctx = impersonation.isImpersonating && impersonation.impersonationId
    ? await getAppContextImpersonated(
        impersonation.impersonationId,
        resolvedParams?.workspaceSlug ?? impersonation.workspaceSlug
      )
    : await getAppContext(resolvedParams?.workspaceSlug);

  if (!ctx.user) {
    redirect("/login");
  }

  if (!ctx.currentWorkspace) {
    redirect("/onboarding");
  }

  // Check if user is Gigaviz platform staff (not just workspace admin)
  const isPlatformAdmin = await isPlatformAdminById(ctx.user.id);

  return (
    <AppShell
      userEmail={ctx.user.email ?? "user"}
      workspaces={ctx.workspaces}
      currentWorkspaceId={ctx.currentWorkspace.id}
      currentWorkspaceSlug={ctx.currentWorkspace.slug}
      isAdmin={isPlatformAdmin}
    >
      {children}
    </AppShell>
  );
}


