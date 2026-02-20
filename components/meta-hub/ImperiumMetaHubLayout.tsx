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
  Layers,
  CloudLightning,
  Settings,
  Bot,
  Users,
  Send,
  Inbox,
  Facebook,
  PenSquare,
  Film,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { MetaHubFlags } from "@/lib/meta-hub/config";
import type { MetaHubAccess, MetaHubSetup } from "@/lib/meta-hub/access";

/* ═══════════════════════════════════════════════════════════════════════════
   HYDRATION-SAFE MOUNT CHECK
   ═══════════════════════════════════════════════════════════════════════════ */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM STATUS BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

type BadgeStatus = "live" | "beta" | "soon" | "locked";

function ImperiumStatusBadge({ status }: { status: BadgeStatus }) {
  const styles: Record<BadgeStatus, string> = {
    live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    beta: "bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/30",
    soon: "bg-[#f5f5dc]/10 text-[#f5f5dc]/50 border-[#f5f5dc]/10",
    locked: "bg-red-500/10 text-red-300 border-red-500/30",
  };
  const labels: Record<BadgeStatus, string> = {
    live: "LIVE",
    beta: "BETA",
    soon: "SOON",
    locked: "LOCKED",
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
  WhatsApp: MessageSquare,
  Instagram: Instagram,
  Messenger: MessagesSquare,
  Facebook: Facebook,
  Ads: Megaphone,
  Automation: Zap,
  "AI Auto-Reply": Bot,
  Insights: BarChart3,
  Templates: MessageSquare,
  Inbox: Inbox,
  Contacts: Users,
  Outbox: Send,
  Assets: Layers,
  Events: CloudLightning,
  Settings: Settings,
  "Content Hub": PenSquare,
  "WA Status": MessageSquare,
  "IG Content": Instagram,
  "FB Content": Facebook,
  Reels: Film,
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

type NavSection = {
  label: string;
  items: NavItem[];
};

function buildNav(
  flags: MetaHubFlags,
  base: string,
  access: MetaHubAccess,
  setup: MetaHubSetup
): NavSection[] {
  const metaHubStatus: BadgeStatus = access.metaHub ? "live" : "locked";
  const connectionsStatus: BadgeStatus = access.metaHub ? "live" : "locked";
  const whatsappStatus: BadgeStatus = access.metaHub
    ? setup.whatsappConfigured
      ? "live"
      : "beta"
    : "locked";
  const templatesStatus: BadgeStatus = !access.templates
    ? "locked"
    : setup.whatsappConfigured
      ? "live"
      : "beta";
  const webhooksStatus: BadgeStatus = !access.webhooks
    ? "locked"
    : setup.whatsappConfigured
      ? "live"
      : "beta";
  const instagramStatus: BadgeStatus = access.metaHub ? "live" : "locked";
  const messengerStatus: BadgeStatus = access.metaHub ? "live" : "locked";
  const adsStatus: BadgeStatus = access.metaHub ? "live" : "locked";
  const insightsStatus: BadgeStatus = access.metaHub ? "live" : "locked";
  const automationStatus: BadgeStatus = access.metaHub ? "live" : "locked";

  const waBase = `${base}/messaging/whatsapp`;
  const contentBase = `${base}/content`;

  return [
    {
      label: "Setup",
      items: [
        { label: "Overview", href: `${base}`, status: metaHubStatus },
        { label: "Connections", href: `${base}/connections`, status: connectionsStatus },
        { label: "Assets", href: `${base}/assets`, status: connectionsStatus },
        { label: "Events", href: `${base}/events`, status: connectionsStatus },
        { label: "Webhooks", href: `${base}/webhooks`, status: webhooksStatus },
      ],
    },
    {
      label: "Messaging",
      items: [
        { label: "WhatsApp", href: `${waBase}/inbox`, status: whatsappStatus },
        { label: "Instagram", href: `${base}/messaging/instagram`, status: instagramStatus },
        { label: "Messenger", href: `${base}/messaging/messenger`, status: messengerStatus },
        { label: "Templates", href: waBase, status: templatesStatus },
        { label: "Contacts", href: `${waBase}/contacts`, status: whatsappStatus },
        { label: "Outbox", href: `${waBase}/outbox`, status: whatsappStatus },
      ],
    },
    {
      label: "Content",
      items: [
        { label: "Content Hub", href: contentBase, status: "beta" as BadgeStatus },
        { label: "WA Status", href: `${contentBase}/whatsapp`, status: "beta" as BadgeStatus },
        { label: "IG Content", href: `${contentBase}/instagram`, status: "beta" as BadgeStatus },
        { label: "FB Content", href: `${contentBase}/facebook`, status: "beta" as BadgeStatus },
      ],
    },
    {
      label: "Growth",
      items: [
        { label: "Ads", href: `${base}/ads`, status: adsStatus },
        { label: "Automation", href: `${base}/automation`, status: automationStatus },
        { label: "AI Auto-Reply", href: `${base}/ai-reply`, status: automationStatus },
      ],
    },
    {
      label: "Analytics",
      items: [
        { label: "Insights", href: `${base}/insights`, status: insightsStatus },
        { label: "Settings", href: `${base}/settings`, status: "live" },
      ],
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
  flags,
  access,
  setup,
}: { 
  basePath: string; 
  flags: MetaHubFlags;
  access: MetaHubAccess;
  setup: MetaHubSetup;
}) {
  const t = useTranslations("metaHubUI.layout");
  const pathname = usePathname();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const sections = buildNav(flags, basePath, access, setup);

  // Count messaging channels for stats
  const messagingSection = sections.find((s) => s.label === "Messaging");
  const contentSection = sections.find((s) => s.label === "Content");
  const totalChannels = messagingSection?.items.filter((i) => ["WhatsApp", "Instagram", "Messenger"].includes(i.label)).length ?? 0;
  const activeChannels = messagingSection?.items.filter((i) => ["WhatsApp", "Instagram", "Messenger"].includes(i.label) && i.status === "live").length ?? 0;
  const contentFeatures = contentSection?.items.length ?? 0;

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
                {t("title")}
              </p>
              <h1 className="text-base font-semibold text-[#f5f5dc]">{t("subtitle")}</h1>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-[#f5f5dc]/5" />
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
              {t("title")}
            </p>
            <h1 className="text-base font-semibold text-[#f5f5dc]">{t("subtitle")}</h1>
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
        className="space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sections.map((section) => (
          <div key={section.label}>
            {/* Section Header */}
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f5f5dc]/30">
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = NAV_ICONS[item.label] || Activity;
                const isExactOverview = item.label === "Overview" && pathname === basePath;
                // Best-match: only highlight if no sibling has a longer matching prefix
                const matchesSelf = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== basePath);
                const siblingHasBetterMatch = section.items.some(
                  (s) => s.href !== item.href && s.href.length > item.href.length && (pathname === s.href || pathname?.startsWith(s.href + "/"))
                );
                const isActive = isExactOverview || (matchesSelf && !siblingHasBetterMatch);
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <motion.div key={item.href} variants={navItemVariants} className="space-y-0.5">
                    <Link
                      href={item.href}
                      className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
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
                          className="ml-4 space-y-0.5 overflow-hidden border-l border-[#d4af37]/20 pl-3"
                        >
                          {item.children!.map((child) => {
                            const ChildIcon = NAV_ICONS[child.label] || Activity;
                            const childActive = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition ${
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
            </div>
          </div>
        ))}
      </motion.nav>

      {/* Footer Stats */}
      <div className="mt-6 rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
          Quick Stats
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-[#f5f5dc]/5 p-2">
            <p className="text-lg font-bold text-[#d4af37]">{totalChannels}</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Channels</p>
          </div>
          <div className="rounded-lg bg-[#f5f5dc]/5 p-2">
            <p className="text-lg font-bold text-emerald-400">{activeChannels}</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Active</p>
          </div>
          <div className="rounded-lg bg-[#f5f5dc]/5 p-2">
            <p className="text-lg font-bold text-purple-400">{contentFeatures}</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Content</p>
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
  access: MetaHubAccess;
  setup: MetaHubSetup;
  ownerGrantActive?: boolean;
};

export function ImperiumMetaHubLayout({
  children,
  basePath,
  flags,
  access,
  setup,
  ownerGrantActive = false,
}: ImperiumMetaHubLayoutProps) {
  return (
    <div className="relative min-h-[600px]">
      {/* Cyber-Batik Pattern Background */}
      <div 
        className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" 
        aria-hidden 
      />

      <div className="relative grid gap-6 lg:grid-cols-[280px_1fr]">
        <ImperiumMetaHubSidebar basePath={basePath} flags={flags} access={access} setup={setup} />
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
