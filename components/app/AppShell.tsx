import Link from "next/link";
import type { ReactNode } from "react";
import WorkspaceSwitcher from "@/components/app/WorkspaceSwitcher";

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
    <div className="min-h-screen bg-gigaviz-bg text-slate-50">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-800 bg-black/30 px-5 py-6 hidden lg:flex lg:flex-col">
          <div className="mb-8">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Gigaviz
            </Link>
            <p className="text-xs text-white/50 mt-1">App Area</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/app" className="rounded-xl px-3 py-2 hover:bg-white/5">
              Dashboard
            </Link>
            <Link href="/app/modules" className="rounded-xl px-3 py-2 hover:bg-white/5">
              Modules
            </Link>
            <Link href="/app/tokens" className="rounded-xl px-3 py-2 hover:bg-white/5">
              Tokens
            </Link>
            <Link href="/app/billing" className="rounded-xl px-3 py-2 hover:bg-white/5">
              Billing
            </Link>
            <Link href="/app/settings" className="rounded-xl px-3 py-2 hover:bg-white/5">
              Settings
            </Link>
          </nav>

          {isAdmin && (
            <div className="mt-auto rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Admin override active
            </div>
          )}
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-black/40 backdrop-blur">
            <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-white/70">Welcome back</p>
                <p className="text-lg font-semibold">{userEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                <WorkspaceSwitcher
                  workspaces={workspaces}
                  currentWorkspaceId={currentWorkspaceId}
                />
              </div>
            </div>
          </header>

          <main className="px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
