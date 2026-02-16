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
      {badge}
    </span>
  );
}

/* ─── Build Nav Sections ───────────────────────────────────── */

function buildSections(basePath: string): NavSection[] {
  return [
    {
      label: "Overview",
      items: [
        { id: "hub", label: "Studio Hub", icon: Palette, href: basePath },
      ],
    },
    {
      label: "Office",
      items: [
        { id: "office", label: "Documents", icon: FileText, href: `${basePath}/office`, badge: "beta" },
        { id: "office-templates", label: "Templates", icon: FolderOpen, href: `${basePath}/office/templates`, badge: "beta" },
        { id: "office-new", label: "New Document", icon: Plus, href: `${basePath}/office/new`, badge: "beta" },
      ],
    },
    {
      label: "Graph",
      items: [
        { id: "graph", label: "Charts", icon: BarChart3, href: `${basePath}/graph`, badge: "beta" },
        { id: "graph-dashboards", label: "Dashboards", icon: LayoutDashboard, href: `${basePath}/graph/dashboards`, badge: "beta" },
        { id: "graph-images", label: "AI Images", icon: ImageIcon, href: `${basePath}/graph/images`, badge: "soon" },
        { id: "graph-videos", label: "AI Videos", icon: VideoIcon, href: `${basePath}/graph/videos`, badge: "soon" },
      ],
    },
    {
      label: "Tracks",
      items: [
        { id: "tracks", label: "Workflows", icon: Workflow, href: `${basePath}/tracks`, badge: "beta" },
        { id: "tracks-runs", label: "Run History", icon: HistoryIcon, href: `${basePath}/tracks/runs`, badge: "beta" },
        { id: "tracks-music", label: "AI Music", icon: MusicIcon, href: `${basePath}/tracks/music`, badge: "soon" },
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
  const sections = buildSections(basePath);
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
              Studio
            </p>
            <h1 className="text-base font-semibold text-[#f5f5dc]">Creative Suite</h1>
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
                const isSoon = item.badge === "soon";
                const Icon = item.icon;

                if (isSoon) {
                  return (
                    <div
                      key={item.id}
                      className="group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#f5f5dc]/30 cursor-not-allowed"
                    >
                      <Icon className="h-4 w-4 text-[#f5f5dc]/20" />
                      <span className="truncate">{item.label}</span>
                      <StatusBadge badge="soon" />
                    </div>
                  );
                }

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
          AI-Powered Creative Suite
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
              {access[mod] ? "Unlocked" : "Locked"}
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
  return (
    <div className="relative min-h-[600px]">
      <div className="relative grid gap-6 lg:grid-cols-[280px_1fr]">
        <StudioSidebar basePath={basePath} access={access} />
        <section className="space-y-6">
          {ownerGrantActive && (
            <div className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Unlocked by owner grant
            </div>
          )}
          {children}
        </section>
      </div>
    </div>
  );
}
