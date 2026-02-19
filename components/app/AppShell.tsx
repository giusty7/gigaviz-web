"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Send,
  Bot,
  Link2,
  Palette,
  AppWindow,
  Store,
  CreditCard,
  Settings,
  Users,
  Coins,
  PanelLeftClose,
  PanelRightOpen,
  Menu,
  X,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import WorkspaceSwitcher from "@/components/app/WorkspaceSwitcher";
import { NotificationBell } from "@/components/app/NotificationBell";
import { RoyalAvatar } from "@/components/app/RoyalAvatar";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal-provider";
import { cn } from "@/lib/utils";

/* ─────────── Types ─────────── */
type WorkspaceItem = { id: string; name: string; slug: string; role: string };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  section: "main" | "products" | "manage";
};

type AppShellProps = {
  userEmail: string;
  workspaces: WorkspaceItem[];
  currentWorkspaceId: string;
  currentWorkspaceSlug?: string | null;
  isAdmin: boolean;
  children: ReactNode;
};

/* ─────────── Breadcrumb hook ─────────── */
function useBreadcrumbs(workspaceName: string) {
  const pathname = usePathname();
  if (!pathname) return [workspaceName];

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.slice(1, 3).map((seg) =>
    seg.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );

  return [workspaceName, ...crumbs];
}

/* ─────────── Shared style constants ─────────── */
const BRAND_GRADIENT = "bg-gradient-to-r from-gigaviz-gold to-gigaviz-gold-bright bg-clip-text text-transparent";
const NAV_ACTIVE = "bg-gigaviz-accentSoft text-foreground";
const NAV_INACTIVE = "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground/80";
const NAV_ICON_ACTIVE = "text-accent";
const SIDEBAR_BORDER = "border-border";
const SIDEBAR_BG = "bg-background";
const BTN_GHOST = "text-foreground/40 transition hover:bg-foreground/[0.06] hover:text-foreground/70";
const SECTION_MUTED = "text-foreground/25";
const CARD_SUBTLE = "border-foreground/[0.06] bg-foreground/[0.02]";

/* ═══════════════════════════════════════ Main Component */
export default function AppShell({
  userEmail,
  workspaces,
  currentWorkspaceId,
  currentWorkspaceSlug,
  isAdmin,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const t = useTranslations("app.sidebar");
  const tApp = useTranslations("appUI.sidebar");
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gv_sidebar_collapsed");
      if (stored === "true") setCollapsed(true);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("gv_sidebar_collapsed", String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const isCollapsed = hydrated ? collapsed : false;
  const currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspaceId) ?? null;
  const slug = currentWorkspaceSlug ?? currentWorkspace?.slug ?? "";
  const billingHref = `/${slug}/billing`;
  const settingsHref = `/${slug}/settings`;

  /* ── Navigation ── */
  const navItems: NavItem[] = [
    { href: `/${slug}/dashboard`, label: t("dashboard"), icon: LayoutDashboard, section: "main" },
    { href: `/${slug}/inbox`, label: t("inbox"), icon: MessageSquare, section: "main" },
    { href: `/${slug}/meta-hub`, label: tApp("metaHub"), icon: Send, section: "products" },
    { href: `/${slug}/helper`, label: tApp("helperAI"), icon: Bot, section: "products" },
    { href: `/${slug}/links`, label: tApp("links"), icon: Link2, section: "products" },
    { href: `/${slug}/modules/studio`, label: tApp("studio"), icon: Palette, section: "products" },
    { href: `/${slug}/marketplace`, label: tApp("marketplace"), icon: Store, section: "products" },
    { href: `/${slug}/apps`, label: tApp("apps"), icon: AppWindow, section: "products" },
    { href: `/${slug}/tokens`, label: t("tokens"), icon: Coins, section: "manage" },
    { href: `/${slug}/platform`, label: t("workspace"), icon: Users, section: "manage" },
    { href: billingHref, label: t("subscription"), icon: CreditCard, section: "manage" },
    { href: settingsHref, label: t("settings"), icon: Settings, section: "manage" },
  ];

  const mainItems = navItems.filter((n) => n.section === "main");
  const productItems = navItems.filter((n) => n.section === "products");
  const manageItems = navItems.filter((n) => n.section === "manage");
  const breadcrumbs = useBreadcrumbs(currentWorkspace?.name ?? "Workspace");

  /* ── Active check (href-based for i18n safety) ── */
  const checkActive = (href: string) => {
    if (!pathname) return false;
    if (href.endsWith("/inbox")) return pathname.includes("/inbox");
    if (href.endsWith("/meta-hub")) return pathname.includes("/meta-hub");
    if (href.endsWith("/helper")) return pathname.includes("/helper");
    if (href.endsWith("/links")) return pathname.includes("/links");
    if (href.endsWith("/modules/studio")) return pathname.includes("/modules/studio") || pathname.includes("/modules/office") || pathname.includes("/modules/graph") || pathname.includes("/modules/tracks");
    return pathname.startsWith(href);
  };

  /* ── Shared nav link (desktop collapsed / expanded) ── */
  const DesktopNavLink = ({ item }: { item: NavItem }) => {
    const active = checkActive(item.href);
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center rounded-xl transition-all duration-150",
          isCollapsed ? "h-10 w-10 justify-center" : "gap-3 px-3 py-2",
          active ? NAV_ACTIVE : NAV_INACTIVE
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {!isCollapsed && active && (
          <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-accent" />
        )}
        <item.icon
          className={cn("shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4", active ? NAV_ICON_ACTIVE : "")}
          aria-hidden="true"
        />
        {!isCollapsed && (
          <span className="truncate text-[13px] font-medium">{item.label}</span>
        )}
      </Link>
    );
  };

  /* ── Section divider ── */
  const SectionLabel = ({ label }: { label: string }) =>
    isCollapsed ? (
      <div className="my-2 h-px w-6 bg-foreground/10 mx-auto" role="separator" />
    ) : (
      <p className={cn("mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.15em]", SECTION_MUTED)}>
        {label}
      </p>
    );

  /* ── Mobile nav link ── */
  const MobileNavLink = ({ item }: { item: NavItem }) => {
    const active = checkActive(item.href);
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
          active ? NAV_ACTIVE : NAV_INACTIVE
        )}
      >
        <item.icon className={cn("h-4 w-4", active ? NAV_ICON_ACTIVE : "")} aria-hidden="true" />
        {item.label}
      </Link>
    );
  };

  /* ═════════════ Render ═════════════ */
  return (
    <UpgradeModalProvider billingHref={billingHref}>
      <div className="gv-app min-h-screen bg-background text-foreground antialiased">
        {/* Mobile overlay */}
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label={t("collapseMenu")}
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          role="navigation"
          aria-label={t("products")}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[280px] overflow-y-auto border-r border-accent/10 px-4 py-5 transition-transform duration-200 ease-out lg:hidden",
            SIDEBAR_BG,
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className={cn("text-lg font-bold", BRAND_GRADIENT)}>
              Gigaviz
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className={cn("flex h-8 w-8 items-center justify-center rounded-lg", BTN_GHOST)}
              aria-label={t("collapseMenu")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Main navigation" className="flex flex-col gap-0.5">
            {mainItems.map((item) => <MobileNavLink key={item.href} item={item} />)}
            <p className={cn("mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.15em]", SECTION_MUTED)}>{t("products")}</p>
            {productItems.map((item) => <MobileNavLink key={item.href} item={item} />)}
            <p className={cn("mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.15em]", SECTION_MUTED)}>{t("manage")}</p>
            {manageItems.map((item) => <MobileNavLink key={item.href} item={item} />)}
          </nav>
          {/* Mobile user info */}
          <div className={cn("mt-4 rounded-xl border px-3 py-2.5", CARD_SUBTLE)}>
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentWorkspaceId={currentWorkspaceId}
            />
          </div>
          <div className={cn("mt-3 rounded-xl border px-3 py-2.5", CARD_SUBTLE)}>
            <p className="truncate text-[13px] font-medium text-foreground/80">{userEmail.split("@")[0]}</p>
            <p className="truncate text-[11px] text-foreground/30">{userEmail}</p>
          </div>
        </aside>

        {/* Desktop grid layout */}
        <div
          className={cn(
            "min-h-screen transition-[grid-template-columns] duration-200 ease-out lg:grid",
            isCollapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[260px_1fr]"
          )}
        >
          {/* Desktop sidebar */}
          <aside
            role="navigation"
            aria-label="Sidebar navigation"
            className={cn(
              "hidden flex-col border-r py-5 transition-[width,padding] duration-200 lg:flex",
              SIDEBAR_BORDER, SIDEBAR_BG,
              isCollapsed ? "w-16 px-2" : "w-[260px] px-4"
            )}
          >
            {/* Brand */}
            <div className={cn("flex w-full items-center mb-2", isCollapsed ? "justify-center" : "justify-between")}>
              <Link href="/" className="flex items-center gap-2" aria-label="Gigaviz home">
                <span className={cn("text-lg font-bold tracking-tight", BRAND_GRADIENT)}>
                  {isCollapsed ? "G" : "Gigaviz"}
                </span>
              </Link>
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label={t("collapseMenu")}
                  className={cn("flex h-7 w-7 items-center justify-center rounded-lg", BTN_GHOST)}
                >
                  <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {isCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={t("expandMenu")}
                className={cn("mb-2 mt-1 flex h-8 w-8 items-center justify-center rounded-lg mx-auto", BTN_GHOST)}
              >
                <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {/* Navigation */}
            <nav aria-label="Main navigation" className={cn("mt-1 flex flex-col gap-0.5", isCollapsed && "w-full items-center")}>
              {mainItems.map((item) => <DesktopNavLink key={item.href} item={item} />)}
              <SectionLabel label={t("products")} />
              {productItems.map((item) => <DesktopNavLink key={item.href} item={item} />)}
              <SectionLabel label={t("manage")} />
              {manageItems.map((item) => <DesktopNavLink key={item.href} item={item} />)}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Staff badge */}
            {isAdmin && !isCollapsed && (
              <div className="mb-3 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[11px] font-medium text-purple-300" role="status">
                🛡️ {t("staffMode")}
              </div>
            )}

            {/* Status */}
            {!isCollapsed ? (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-success/15 bg-success/5 px-3 py-1.5" role="status" aria-label={t("operational")}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="text-[11px] font-medium text-success/80">{t("operational")}</span>
              </div>
            ) : (
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-success/15 bg-success/5 mx-auto" role="status" aria-label={t("operational")}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
              </div>
            )}

            {/* User card */}
            {!isCollapsed && (
              <div className={cn("rounded-xl border px-3 py-2.5", CARD_SUBTLE)}>
                <p className="truncate text-[13px] font-medium text-foreground/80">
                  {userEmail.split("@")[0]}
                </p>
                <p className="truncate text-[11px] text-foreground/30">{userEmail}</p>
              </div>
            )}
          </aside>

          {/* Main content area */}
          <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
              <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
                {/* Mobile hamburger */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] lg:hidden"
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-sidebar"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Mobile brand */}
                <span className={cn("text-base font-bold lg:hidden", BRAND_GRADIENT)}>
                  Gigaviz
                </span>

                {/* Desktop breadcrumbs */}
                <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm lg:flex">
                  <ol className="flex items-center gap-1">
                    {breadcrumbs.map((crumb, i) => (
                      <li key={`${crumb}-${i}`} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="h-3 w-3 text-foreground/20" aria-hidden="true" />}
                        <span className={i === 0 ? "font-medium text-accent" : "text-muted-foreground"}>
                          {crumb}
                        </span>
                      </li>
                    ))}
                  </ol>
                </nav>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right actions */}
                <div className="flex items-center gap-2">
                  {slug && (
                    <NotificationBell
                      workspaceId={currentWorkspaceId}
                      workspaceSlug={slug}
                    />
                  )}
                  <div className="hidden sm:block">
                    <WorkspaceSwitcher
                      workspaces={workspaces}
                      currentWorkspaceId={currentWorkspaceId}
                    />
                  </div>
                  <RoyalAvatar
                    name={userEmail.split("@")[0]}
                    email={userEmail}
                    settingsHref={settingsHref}
                    billingHref={billingHref}
                  />
                </div>
              </div>
            </header>

            {/* Page content */}
            <main id="main-content" className="flex-1 px-4 py-6 lg:px-6 lg:py-8">{children}</main>
          </div>
        </div>
      </div>
    </UpgradeModalProvider>
  );
}
