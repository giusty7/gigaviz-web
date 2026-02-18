"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ActivitySquare,
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  Code,
  HeartPulse,
  Home,
  Key,
  LayoutPanelLeft,
  MessageSquareText,
  ScrollText,
  ShieldCheck,
  Ticket,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { opsTheme } from "@/lib/ops/theme";
import { useTranslations } from "next-intl";

type OpsShellProps = {
  children: ReactNode;
  actorEmail?: string | null;
  actorRole?: string | null;
};

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  Home,
  Building2,
  Users,
  Key,
  BookOpen,
  ScrollText,
  HeartPulse,
  BarChart3,
  Zap,
  Code,
  LayoutPanelLeft,
  Ticket,
  MessageSquareText,
  Activity,
};

// Group nav items with separators
const NAV_ITEMS = opsTheme.nav.items.map((item) => ({
  ...item,
  icon: iconMap[item.icon] ?? Building2,
}));

// Get unique groups in order
const GROUPS = opsTheme.nav.groups;

export function OpsShell({ children, actorEmail, actorRole }: OpsShellProps) {
  const t = useTranslations("opsUI");
  const pathname = usePathname();
  const { colors, opacity, watermark, header } = opsTheme;

  // Group items by category
  const groupedItems = GROUPS.map(group => ({
    ...group,
    items: NAV_ITEMS.filter(item => item.group === group.id)
  }));

  return (
    <div 
      className="relative min-h-screen text-foreground"
      style={{
        background: `linear-gradient(to bottom, ${colors.backgroundAlt}, ${colors.background}, ${colors.backgroundLight})`
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ opacity: opacity.batik }}>
        <div className="batik-overlay" style={{ opacity: opacity.batik }} />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${watermark.size}' height='${watermark.size}' viewBox='0 0 ${watermark.size} ${watermark.size}'%3E%3Ctext x='30' y='140' font-family='Inter' font-size='34' fill='rgba(212,175,55,${watermark.opacity})' transform='rotate(${watermark.rotation} 140 140)'%3E${watermark.text}%3C/text%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: `${watermark.size}px ${watermark.size}px`,
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:px-8">
        <header 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border px-4 py-4 shadow-sm backdrop-blur"
          style={{
            borderColor: `rgba(212,175,55,${opacity.primary.border})`,
            backgroundColor: `rgba(5,10,24,${opacity.background.header})`,
          }}
        >
          <div className="space-y-1">
            <p 
              className="text-xs uppercase"
              style={{ 
                letterSpacing: "0.2em",
                color: colors.primary 
              }}
            >
              {header.subtitle}
            </p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 flex-shrink-0" style={{ color: colors.primary }} />
              <h1 className="text-xl font-semibold leading-tight" style={{ color: colors.text }}>
                {t("shell.title")}
              </h1>
            </div>
            <p className="text-sm" style={{ color: `rgba(245,245,220,${opacity.text.muted})` }}>
              {t("shell.subtitle")}
            </p>
          </div>
          <div 
            className="flex items-center gap-3 rounded-xl border px-4 py-3 text-xs backdrop-blur"
            style={{
              borderColor: `rgba(212,175,55,0.30)`,
              backgroundColor: `rgba(10,18,41,${opacity.background.badge})`,
              color: `rgba(245,245,220,0.80)`,
            }}
          >
            <ActivitySquare className="h-4 w-4 flex-shrink-0" style={{ color: colors.primary }} />
            <div className="flex flex-col">
              <span className="truncate max-w-[200px]" style={{ color: colors.text }}>{actorEmail ?? "platform-admin"}</span>
              <span 
                className="font-semibold uppercase"
                style={{ 
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                }}
              >
                {(actorRole ?? "platform_admin").toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {groupedItems.map((group, groupIndex) => (
            <div key={group.id} className="flex items-center gap-1">
              {/* Group separator (except first) */}
              {groupIndex > 0 && (
                <div 
                  className="h-6 w-px mx-1 hidden sm:block" 
                  style={{ backgroundColor: `rgba(212,175,55,0.2)` }}
                />
              )}
              {/* Group items */}
              {group.items.map((item) => {
                // Special handling for exact match routes
                const isExactRoute = item.href === "/ops" || item.href === "/ops/god-console";
                const active = isExactRoute
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className="group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition backdrop-blur whitespace-nowrap touch-manipulation"
                    style={{
                      borderColor: active 
                        ? `rgba(212,175,55,${opacity.primary.borderActive})` 
                        : `rgba(212,175,55,0.15)`,
                      backgroundColor: active 
                        ? `rgba(212,175,55,${opacity.primary.bg})` 
                        : `rgba(5,10,24,${opacity.background.nav})`,
                      color: active 
                        ? colors.text 
                        : `rgba(245,245,220,${opacity.text.veryMuted})`,
                      boxShadow: active ? `0 0 20px rgba(212,175,55,0.25)` : "none",
                    }}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <main 
          id="main-content"
          className="mb-10 space-y-6 rounded-2xl border p-3 sm:p-4 md:p-6 backdrop-blur-lg"
          style={{
            borderColor: `rgba(212,175,55,${opacity.primary.borderLight})`,
            backgroundColor: `rgba(5,10,24,${opacity.background.card})`,
            boxShadow: `0 30px 80px -50px rgba(0,0,0,0.7)`,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
