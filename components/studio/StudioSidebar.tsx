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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ─── Types ────────────────────────────────────────────────── */

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: "beta" | "new" | "soon";
};

type NavSection = {
  label: string;
  items: NavItem[];
};

type StudioSidebarProps = {
  basePath: string; // e.g. /workspace-slug/modules/studio
  access: {
    office: boolean;
    graph: boolean;
    tracks: boolean;
  };
};

/* ─── Badge Component ──────────────────────────────────────── */

function StatusBadge({ badge }: { badge: "beta" | "new" | "soon" }) {
  const t = useTranslations("studio");
  const styles = {
    beta: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    new: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    soon: "bg-[#f5f5dc]/10 text-[#f5f5dc]/40 border-[#f5f5dc]/10",
  };

  return (
    <span
      className={cn(
        "ml-auto rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider",
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
      label: t("sidebar.sections.overview"),
      items: [
        { id: "hub", label: t("sidebar.nav.studioHub"), icon: Palette, href: basePath },
      ],
    },
    {
      label: t("sidebar.sections.office"),
      items: [
        { id: "office", label: t("sidebar.nav.documents"), icon: FileText, href: `${basePath}/office` },
        { id: "office-templates", label: t("sidebar.nav.templates"), icon: FolderOpen, href: `${basePath}/office/templates` },
        { id: "office-new", label: t("sidebar.nav.newDocument"), icon: Plus, href: `${basePath}/office/new` },
      ],
    },
    {
      label: t("sidebar.sections.graph"),
      items: [
        { id: "graph", label: t("sidebar.nav.charts"), icon: BarChart3, href: `${basePath}/graph` },
        { id: "graph-dashboards", label: t("sidebar.nav.dashboards"), icon: LayoutDashboard, href: `${basePath}/graph/dashboards` },
        { id: "graph-images", label: t("sidebar.nav.aiImages"), icon: ImageIcon, href: `${basePath}/graph/images`, badge: "new" },
        { id: "graph-videos", label: t("sidebar.nav.aiVideos"), icon: VideoIcon, href: `${basePath}/graph/videos`, badge: "beta" },
      ],
    },
    {
      label: t("sidebar.sections.tracks"),
      items: [
        { id: "tracks", label: t("sidebar.nav.workflows"), icon: Workflow, href: `${basePath}/tracks`, badge: "beta" },
        { id: "tracks-runs", label: t("sidebar.nav.runHistory"), icon: HistoryIcon, href: `${basePath}/tracks/runs`, badge: "beta" },
        { id: "tracks-music", label: t("sidebar.nav.aiMusic"), icon: MusicIcon, href: `${basePath}/tracks/music`, badge: "beta" },
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

/* ─── Main Component ───────────────────────────────────────── */

export function StudioSidebar({ basePath, access }: StudioSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("studio");
  const sections = buildSections(basePath, t);
  const activeId = useActiveItem(sections, pathname);

  return (
    <aside className="overflow-y-auto rounded-2xl border border-cyan-500/20 bg-[#0a1229]/80 p-4 backdrop-blur-3xl">
      {/* Header */}
      <div className="mb-4">
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

      {/* Sections */}
      <nav className="space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f5f5dc]/30">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
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
                        : "text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-cyan-400" : "text-[#f5f5dc]/40 group-hover:text-[#f5f5dc]/60"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {item.badge && <StatusBadge badge={item.badge} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Studio Badge */}
      <div className="mt-6 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
        <SparklesIcon className="h-4 w-4 text-cyan-400" />
        <span className="text-[10px] font-semibold text-cyan-400">
          {t("sidebar.poweredBadge")}
        </span>
      </div>

      {/* Access Summary */}
      <div className="mt-3 space-y-1 px-1">
        {(["office", "graph", "tracks"] as const).map((mod) => (
          <div key={mod} className="flex items-center justify-between text-[10px]">
            <span className="capitalize text-[#f5f5dc]/40">{mod}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-semibold",
                access[mod]
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              )}
            >
              {access[mod] ? t("common.unlocked") : t("common.locked")}
            </span>
          </div>
        ))}
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
        <section className="space-y-6">
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
