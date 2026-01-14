import Link from "next/link";
import type { ReactNode } from "react";
import AppNavLinks from "@/components/app/AppNavLinks";
import WorkspaceSwitcher from "@/components/app/WorkspaceSwitcher";
import { NotificationBell } from "@/components/app/NotificationBell";
import { AppShell as Shell } from "@/components/layout/app-shell";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal-provider";

type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type AppShellProps = {
  userEmail: string;
  workspaces: WorkspaceItem[];
  currentWorkspaceId: string;
  currentWorkspaceSlug?: string | null;
  isAdmin: boolean;
  children: ReactNode;
};

export default function AppShell({
  userEmail,
  workspaces,
  currentWorkspaceId,
  currentWorkspaceSlug,
  isAdmin,
  children,
}: AppShellProps) {
  const currentWorkspace =
    workspaces.find((ws) => ws.id === currentWorkspaceId) ?? null;
  const workspaceSlug = currentWorkspaceSlug ?? currentWorkspace?.slug ?? null;
  const dashboardHref = workspaceSlug ? `/${workspaceSlug}/dashboard` : "/";
  const modulesHref = workspaceSlug ? `/${workspaceSlug}/modules` : "/modules";
  const tokensHref = workspaceSlug ? `/${workspaceSlug}/tokens` : "/tokens";
  const billingHref = workspaceSlug ? `/${workspaceSlug}/billing` : "/billing";
  const settingsHref = workspaceSlug ? `/${workspaceSlug}/settings` : "/settings";
  const navLinks = [
    { href: dashboardHref, label: "Dashboard" },
    { href: modulesHref, label: "Modules" },
    { href: tokensHref, label: "Tokens" },
    { href: billingHref, label: "Billing" },
    { href: settingsHref, label: "Settings" },
  ];

  return (
    <UpgradeModalProvider billingHref={billingHref}>
      <Shell
        className="gv-app"
        sidebar={
          <>
            <div className="mb-8">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Gigaviz
              </Link>
              <p className="mt-1 text-xs text-gigaviz-muted">App Area</p>
            </div>
            <AppNavLinks links={navLinks} />

            {isAdmin && (
              <div className="mt-auto rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Admin override active
              </div>
            )}
          </>
        }
        header={
          <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gigaviz-muted">Welcome back</p>
              <p className="text-lg font-semibold">{userEmail}</p>
            </div>
            <div className="flex items-center gap-3">
              {workspaceSlug && (
                <NotificationBell
                  workspaceId={currentWorkspaceId}
                  workspaceSlug={workspaceSlug}
                />
              )}
              <WorkspaceSwitcher
                workspaces={workspaces}
                currentWorkspaceId={currentWorkspaceId}
              />
            </div>
          </div>
        }
      >
        {children}
      </Shell>
    </UpgradeModalProvider>
  );
}
