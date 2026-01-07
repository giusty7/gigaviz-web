import Link from "next/link";
import type { ReactNode } from "react";
import WorkspaceSwitcher from "@/components/app/WorkspaceSwitcher";
import { AppShell as Shell } from "@/components/layout/app-shell";

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
  isAdmin: boolean;
  children: ReactNode;
};

export default function AppShell({
  userEmail,
  workspaces,
  currentWorkspaceId,
  isAdmin,
  children,
}: AppShellProps) {
  return (
    <Shell
      sidebar={
        <>
          <div className="mb-8">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Gigaviz
            </Link>
            <p className="mt-1 text-xs text-gigaviz-muted">App Area</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/app" className="rounded-xl px-3 py-2 hover:bg-gigaviz-surface">
              Dashboard
            </Link>
            <Link
              href="/app/modules"
              className="rounded-xl px-3 py-2 hover:bg-gigaviz-surface"
            >
              Modules
            </Link>
            <Link
              href="/app/tokens"
              className="rounded-xl px-3 py-2 hover:bg-gigaviz-surface"
            >
              Tokens
            </Link>
            <Link
              href="/app/billing"
              className="rounded-xl px-3 py-2 hover:bg-gigaviz-surface"
            >
              Billing
            </Link>
            <Link
              href="/app/settings"
              className="rounded-xl px-3 py-2 hover:bg-gigaviz-surface"
            >
              Settings
            </Link>
          </nav>

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
  );
}
