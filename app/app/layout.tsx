import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AppShell from "@/components/app/AppShell";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await getAppContext();

  if (!ctx.user) {
    redirect("/login");
  }

  if (!ctx.currentWorkspace) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      userEmail={ctx.user.email ?? "user"}
      workspaces={ctx.workspaces}
      currentWorkspaceId={ctx.currentWorkspace.id}
      isAdmin={Boolean(ctx.profile?.is_admin)}
    >
      {children}
    </AppShell>
  );
}
