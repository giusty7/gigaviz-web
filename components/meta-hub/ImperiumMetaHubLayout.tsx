"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  MessageSquare,
  Webhook,
  Link2,
  Instagram,
  MessagesSquare,
  Megaphone,
  BarChart3,
  ChevronRight,
  Zap,
  Shield,
  Activity,
} from "lucide-react";
import type { MetaHubFlags } from "@/lib/meta-hub/config";

/* ═══════════════════════════════════════════════════════════════════════════
   HYDRATION-SAFE MOUNT CHECK
   ═══════════════════════════════════════════════════════════════════════════ */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM STATUS BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

type BadgeStatus = "live" | "beta" | "soon";

function ImperiumStatusBadge({ status }: { status: BadgeStatus }) {
  const styles: Record<BadgeStatus, string> = {
    live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    beta: "bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/30",
    soon: "bg-[#f5f5dc]/10 text-[#f5f5dc]/50 border-[#f5f5dc]/10",
  };
  const labels: Record<BadgeStatus, string> = {
    live: "LIVE",
    beta: "BETA",
    soon: "SOON",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status === "live" && (
        <span className="mr-1.5 flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
      {labels[status]}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAV ICON MAPPING
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Overview: Activity,
  Connections: Link2,
  Webhooks: Webhook,
  "Messaging - WhatsApp": MessageSquare,
  "Messaging - Instagram": Instagram,
  "Messaging - Messenger": MessagesSquare,
  Ads: Megaphone,
  Insights: BarChart3,
  Templates: MessageSquare,
  Inbox: MessagesSquare,
};

/* ═══════════════════════════════════════════════════════════════════════════
   NAV ITEM TYPE
   ═══════════════════════════════════════════════════════════════════════════ */

type NavItem = {
  label: string;
  href: string;
  status: BadgeStatus;
  children?: NavItem[];
};

function buildNav(flags: MetaHubFlags, base: string): NavItem[] {
  return [
    { label: "Overview", href: `${base}`, status: "live" },
    { label: "Connections", href: `${base}/connections`, status: "live" },
    { label: "Webhooks", href: `${base}/webhooks`, status: "live" },
    {
      label: "Messaging - WhatsApp",
      href: `${base}/messaging/whatsapp`,
      status: flags.waEnabled ? "live" : "beta",
      children: [
        { label: "Templates", href: `${base}/messaging/whatsapp`, status: "live" },
        { label: "Inbox", href: `${base}/messaging/whatsapp/inbox`, status: "live" },
      ],
    },
    {
      label: "Messaging - Instagram",
      href: `${base}/messaging/instagram`,
      status: flags.igEnabled ? "live" : "soon",
    },
    {
      label: "Messaging - Messenger",
      href: `${base}/messaging/messenger`,
      status: flags.msEnabled ? "beta" : "soon",
    },
    { label: "Ads", href: `${base}/ads`, status: flags.adsEnabled ? "beta" : "soon" },
    {
      label: "Insights",
      href: `${base}/insights`,
      status: flags.insightsEnabled ? "beta" : "soon",
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM META HUB SIDEBAR
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumMetaHubSidebar({ 
  basePath, 
  flags 
}: { 
  basePath: string; 
  flags: MetaHubFlags;
}) {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const items = buildNav(flags, basePath);

  if (!mounted) {
    return (
      <aside className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-4 backdrop-blur-3xl">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10">
              <Zap className="h-5 w-5 text-[#d4af37]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                Meta Hub
              </p>
              <h1 className="text-base font-semibold text-[#f5f5dc]">Integration Center</h1>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.href} className="h-10 animate-pulse rounded-xl bg-[#f5f5dc]/5" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-4 backdrop-blur-3xl">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
            <Zap className="h-5 w-5 text-[#d4af37]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Meta Hub
            </p>
            <h1 className="text-base font-semibold text-[#f5f5dc]">Integration Center</h1>
          </div>
        </div>
        {/* Meta Partner Badge */}
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400">
            Meta Tech Provider Verified
          </span>
        </div>
      </div>

      {/* Navigation */}
      <motion.nav
        className="space-y-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {items.map((item) => {
          const Icon = NAV_ICONS[item.label] || Activity;
          const active = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== basePath);
          const isExactOverview = item.label === "Overview" && pathname === basePath;
          const isActive = isExactOverview || active;
          const hasChildren = item.children && item.children.length > 0;

          return (
            <motion.div key={item.href} variants={navItemVariants} className="space-y-1">
              <Link
                href={item.href}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#d4af37]/15 to-[#f9d976]/5 text-[#d4af37] shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]"
                    : "text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-[#d4af37]" : "text-[#f5f5dc]/40 group-hover:text-[#f5f5dc]/60"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="flex items-center gap-2">
                  <ImperiumStatusBadge status={item.status} />
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-[#d4af37]" />}
                </span>
              </Link>

              {/* Children */}
              <AnimatePresence>
                {hasChildren && isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1 overflow-hidden border-l border-[#d4af37]/20 pl-3"
                  >
                    {item.children!.map((child) => {
                      const ChildIcon = NAV_ICONS[child.label] || Activity;
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                            childActive
                              ? "bg-[#d4af37]/10 text-[#d4af37]"
                              : "text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ChildIcon className="h-3.5 w-3.5" />
                            {child.label}
                          </span>
                          <ImperiumStatusBadge status={child.status} />
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Footer Stats */}
      <div className="mt-6 rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
          Quick Stats
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-[#f5f5dc]/5 p-2">
            <p className="text-lg font-bold text-[#d4af37]">5</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Channels</p>
          </div>
          <div className="rounded-lg bg-[#f5f5dc]/5 p-2">
            <p className="text-lg font-bold text-emerald-400">1</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM META HUB LAYOUT WRAPPER
   ═══════════════════════════════════════════════════════════════════════════ */

type ImperiumMetaHubLayoutProps = {
  children: ReactNode;
  basePath: string;
  flags: MetaHubFlags;
};

export function ImperiumMetaHubLayout({ children, basePath, flags }: ImperiumMetaHubLayoutProps) {
  return (
    <div className="relative min-h-[600px]">
      {/* Cyber-Batik Pattern Background */}
      <div 
        className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" 
        aria-hidden 
      />

      <div className="relative grid gap-6 lg:grid-cols-[280px_1fr]">
        <ImperiumMetaHubSidebar basePath={basePath} flags={flags} />
        <section className="space-y-6">{children}</section>
      </div>
    </div>
  );
}
