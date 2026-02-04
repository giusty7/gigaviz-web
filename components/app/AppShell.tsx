"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelRightOpen } from "lucide-react";
import AppNavLinks from "@/components/app/AppNavLinks";
import WorkspaceSwitcher from "@/components/app/WorkspaceSwitcher";
import { NotificationBell } from "@/components/app/NotificationBell";
import { RoyalAvatar, SidebarUserCard } from "@/components/app/RoyalAvatar";
import { AppShell as Shell } from "@/components/layout/app-shell";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal-provider";
import { cn } from "@/lib/utils";

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
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("gv_sidebar_collapsed") : null;
      if (stored === "true") {
        setCollapsed(true);
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  const handleToggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gv_sidebar_collapsed", String(next));
      } catch {
        // ignore persistence errors
      }
      return next;
    });
  };

  const isCollapsed = hydrated ? collapsed : false;
  const currentWorkspace =
    workspaces.find((ws) => ws.id === currentWorkspaceId) ?? null;
  const workspaceSlug = currentWorkspaceSlug ?? currentWorkspace?.slug ?? null;
  const dashboardHref = workspaceSlug ? `/${workspaceSlug}/dashboard` : "/";
  const inboxHref = workspaceSlug ? `/${workspaceSlug}/inbox` : "/inbox";
  const productsHref = workspaceSlug ? `/${workspaceSlug}/products` : "/products";
  const tokensHref = workspaceSlug ? `/${workspaceSlug}/tokens` : "/tokens";
  const workspaceManageHref = workspaceSlug ? `/${workspaceSlug}/platform` : "/platform";
  const billingHref = workspaceSlug ? `/${workspaceSlug}/billing` : "/billing";
  const settingsHref = workspaceSlug ? `/${workspaceSlug}/settings` : "/settings";
  const navLinks = [
    { href: dashboardHref, label: "Dashboard" },
    { href: inboxHref, label: "Inbox" },
    { href: productsHref, label: "Products" },
    { href: tokensHref, label: "Tokens" },
    { href: workspaceManageHref, label: "Workspace" },
    { href: billingHref, label: "Subscription" },
    { href: settingsHref, label: "Settings" },
  ];

  return (
    <UpgradeModalProvider billingHref={billingHref}>
      <Shell
        className="gv-app"
        collapsed={isCollapsed}
        sidebar={
          <div className={cn("relative flex h-full flex-col", isCollapsed && "items-center")}>
            {/* Sidebar Header with Toggle */}
            <div className={cn(
              "mb-6 flex w-full items-center",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              <div className={cn("flex min-w-0 flex-col", isCollapsed && "items-center")}>
                <Link
                  href="/"
                  className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-lg font-bold tracking-tight text-transparent"
                >
                  {isCollapsed ? "G" : "Gigaviz"}
                </Link>
                {!isCollapsed && <p className="mt-1 text-xs text-[#f5f5dc]/40">Management Console</p>}
              </div>
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={handleToggleSidebar}
                  aria-label="Collapse sidebar"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d4af37]/20 bg-[#0a1229]/60 text-[#f5f5dc]/60 transition-all hover:border-[#d4af37]/50 hover:text-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/50"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Expand Toggle (Collapsed Mode) */}
            {isCollapsed && (
              <button
                type="button"
                onClick={handleToggleSidebar}
                aria-label="Expand sidebar"
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/25 bg-[#0a1229]/80 text-[#f5f5dc]/70 transition-all hover:border-[#d4af37]/50 hover:text-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/50"
              >
                <PanelRightOpen className="h-5 w-5" />
              </button>
            )}

            {/* Navigation Links */}
            <AppNavLinks links={navLinks} collapsed={isCollapsed} />

            {isAdmin && !isCollapsed && (
              <div className="mt-6 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs text-purple-100">
                🛡️ Gigaviz Staff Mode
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* System Health Widget */}
            {isCollapsed ? (
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#10b981]/20 bg-[#10b981]/5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                </span>
              </div>
            ) : (
              <div className="mb-4 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                  </span>
                  <span className="text-xs font-medium text-[#10b981]">Secure Link Active</span>
                </div>
              </div>
            )}

            {/* Sidebar User Identity Card */}
            {!isCollapsed && (
              <SidebarUserCard
                name={userEmail.split("@")[0]}
                email={userEmail}
                tier={isAdmin ? "Imperium Admin" : "Imperium Member"}
              />
            )}
          </div>
        }
        header={
          <div className="flex items-center gap-4 px-6 py-3">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#d4af37] font-medium">Imperium</span>
              <span className="text-[#f5f5dc]/30">/</span>
              <span className="text-[#f5f5dc]/60">{currentWorkspace?.name ?? "Workspace"}</span>
            </div>

            {/* Center: Global Search */}
            <div className="hidden flex-1 justify-center md:flex">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search commands, contacts, messages..."
                  className="w-full rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 px-4 py-2 pl-10 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 backdrop-blur transition-all focus:border-[#d4af37]/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                />
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f5f5dc]/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[#f5f5dc]/10 bg-[#f5f5dc]/5 px-1.5 py-0.5 text-[10px] text-[#f5f5dc]/40">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right: Crown Jewels */}
            <div className="ml-auto flex items-center gap-3">
              {/* System Status */}
              <div className="hidden items-center gap-1.5 rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 px-2.5 py-1.5 md:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
                </span>
                <span className="text-[10px] font-semibold tracking-wide text-[#10b981]">OPERATIONAL</span>
              </div>

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
              {/* Royal Avatar with Dropdown */}
              <RoyalAvatar
                name={userEmail.split("@")[0]}
                email={userEmail}
                settingsHref={settingsHref}
                billingHref={billingHref}
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
