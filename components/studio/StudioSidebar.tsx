"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Palette,
  FileText,
  FolderOpen,
  Plus,
  BarChart3,
  LayoutDashboard,
  Workflow,
  HistoryIcon,
  SparklesIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";

/* ─── Types ────────────────────────────────────────────────── */

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: "beta" | "new" | "soon" | "live";
  indent?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

type StudioSidebarProps = {
  basePath: string;
  access: {
    office: boolean;
    graph: boolean;
    tracks: boolean;
  };
};

/* ─── Badge Component ──────────────────────────────────────── */

function StatusBadge({ badge }: { badge: "beta" | "new" | "soon" | "live" }) {
  const t = useTranslations("studio");
  const styles = {
    beta: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    new: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    soon: "bg-[#f5f5dc]/10 text-[#f5f5dc]/40 border-[#f5f5dc]/10",
    live: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  };

  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider",
        styles[badge]
      )}
    >
      {t(`sidebar.badges.${badge}`)}
    </span>
  );
}

/* ─── Build Nav Sections ───────────────────────────────────── */

function buildSections(basePath: string, t: (key: string) => string): NavSection[] {
  return [
    {
      id: "overview",
      label: t("sidebar.sections.overview"),
      items: [
        { id: "hub", label: t("sidebar.nav.studioHub"), icon: Palette, href: basePath },
      ],
    },
    {
      id: "office",
      label: t("sidebar.sections.office"),
      collapsible: true,
      defaultOpen: true,
      items: [
        { id: "office", label: t("sidebar.nav.documents"), icon: FileText, href: `${basePath}/office`, badge: "live" },
        { id: "office-templates", label: t("sidebar.nav.templates"), icon: FolderOpen, href: `${basePath}/office/templates` },
        { id: "office-new", label: t("sidebar.nav.newDocument"), icon: Plus, href: `${basePath}/office/new` },
      ],
    },
    {
      id: "graph",
      label: t("sidebar.sections.graph"),
      collapsible: true,
      defaultOpen: true,
      items: [
        { id: "graph", label: t("sidebar.nav.charts"), icon: BarChart3, href: `${basePath}/graph`, badge: "live" },
        { id: "graph-dashboards", label: t("sidebar.nav.dashboards"), icon: LayoutDashboard, href: `${basePath}/graph/dashboards` },
        { id: "graph-images", label: t("sidebar.nav.aiImages"), icon: ImageIcon, href: `${basePath}/graph/images`, badge: "new" },
        { id: "graph-videos", label: t("sidebar.nav.aiVideos"), icon: VideoIcon, href: `${basePath}/graph/videos`, badge: "live" },
      ],
    },
    {
      id: "tracks",
      label: t("sidebar.sections.tracks"),
      collapsible: true,
      defaultOpen: true,
      items: [
        { id: "tracks", label: t("sidebar.nav.workflows"), icon: Workflow, href: `${basePath}/tracks`, badge: "live" },
        { id: "tracks-runs", label: t("sidebar.nav.runHistory"), icon: HistoryIcon, href: `${basePath}/tracks/runs` },
        { id: "tracks-music", label: t("sidebar.nav.aiMusic"), icon: MusicIcon, href: `${basePath}/tracks/music`, badge: "new" },
      ],
    },
  ];
}

/* ─── Active Detection (best-match among siblings) ─────────── */

function useActiveItem(sections: NavSection[], pathname: string): string | null {
  let bestId: string | null = null;
  let bestLen = 0;

  for (const section of sections) {
    for (const item of section.items) {
      if (item.href.includes("#")) continue;
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        if (item.href.length > bestLen) {
          bestLen = item.href.length;
          bestId = item.id;
        }
      }
    }
  }

  return bestId;
}

/* ─── Collapsible Section ──────────────────────────────────── */

function CollapsibleSection({
  section,
  activeId,
}: {
  section: NavSection;
  activeId: string | null;
}) {
  const hasActive = section.items.some((item) => item.id === activeId);
  const [open, setOpen] = useState(section.defaultOpen || hasActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f5f5dc]/30 transition-colors hover:text-[#f5f5dc]/50"
      >
        <span>{section.label}</span>
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "mt-1 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <NavItemsList items={section.items} activeId={activeId} />
      </div>
    </div>
  );
}

/* ─── Nav Items ────────────────────────────────────────────── */

function NavItemsList({
  items,
  activeId,
}: {
  items: NavItem[];
  activeId: string | null;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-cyan-500/15 to-teal-400/5 text-cyan-300 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"
                : "text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]",
              item.indent && "ml-4"
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400" />
            )}
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-cyan-400" : "text-[#f5f5dc]/40 group-hover:text-[#f5f5dc]/60"
              )}
            />
            <span className="truncate">{item.label}</span>
            {item.badge && <StatusBadge badge={item.badge} />}
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────── */

export function StudioSidebar({ basePath, access }: StudioSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("studio");
  const sections = buildSections(basePath, t);
  const activeId = useActiveItem(sections, pathname);

  return (
    <aside className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-cyan-500/20 bg-[#0a1229]/80 p-4 backdrop-blur-3xl scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-400/10 shadow-lg shadow-cyan-500/10">
            <Palette className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              {t("sidebar.brand")}
            </p>
            <h1 className="text-base font-semibold text-[#f5f5dc]">{t("sidebar.subtitle")}</h1>
          </div>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#f5f5dc]/5 bg-[#f5f5dc]/[0.02] p-2">
        {(["office", "graph", "tracks"] as const).map((mod) => (
          <div
            key={mod}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors",
              access[mod]
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-[#f5f5dc]/5 text-[#f5f5dc]/30"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                access[mod] ? "bg-emerald-400" : "bg-[#f5f5dc]/20"
              )}
            />
            <span className="capitalize">{mod}</span>
          </div>
        ))}
      </div>

      {/* Sections */}
      <nav className="space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            {section.collapsible ? (
              <CollapsibleSection section={section} activeId={activeId} />
            ) : (
              <div>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f5f5dc]/30">
                  {section.label}
                </p>
                <NavItemsList items={section.items} activeId={activeId} />
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Studio Badge */}
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-teal-500/5 px-3 py-2">
        <SparklesIcon className="h-4 w-4 shrink-0 text-cyan-400" />
        <span className="text-[10px] font-semibold text-cyan-400">
          {t("sidebar.poweredBadge")}
        </span>
      </div>
    </aside>
  );
}

/* ─── Layout Wrapper ───────────────────────────────────────── */

type StudioLayoutShellProps = {
  children: React.ReactNode;
  basePath: string;
  access: StudioSidebarProps["access"];
  ownerGrantActive?: boolean;
};

export function StudioLayoutShell({
  children,
  basePath,
  access,
  ownerGrantActive = false,
}: StudioLayoutShellProps) {
  const t = useTranslations("studio");
  return (
    <div className="relative min-h-[600px]">
      <div className="relative grid gap-6 lg:grid-cols-[280px_1fr]">
        <StudioSidebar basePath={basePath} access={access} />
        <section className="min-w-0 space-y-6">
          {ownerGrantActive && (
            <div className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              {t("sidebar.ownerGrant")}
            </div>
          )}
          {children}
        </section>
      </div>
    </div>
  );
}
