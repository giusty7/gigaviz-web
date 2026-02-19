"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Zap,
  Shield,
  Activity,
  TrendingUp,
  Send,
  Inbox,
  Settings,
  Eye,
  ChevronRight,
  Terminal,
  RefreshCw,
  Lock,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   HYDRATION-SAFE MOUNT CHECK
   ═══════════════════════════════════════════════════════════════════════════ */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   WABA STATUS HERO CARD
   ═══════════════════════════════════════════════════════════════════════════ */

type WABAStatusHeroProps = {
  connected: boolean;
  wabaIdMasked: string;
  phoneIdMasked: string;
  tokenConfigured: boolean;
  qualityRating?: "GREEN" | "YELLOW" | "RED" | null;
  verificationStatus?: "verified" | "pending" | "none";
};

export function WABAStatusHero({
  connected,
  wabaIdMasked,
  phoneIdMasked,
  tokenConfigured,
  qualityRating = null,
  verificationStatus = "none",
}: WABAStatusHeroProps) {
  const t = useTranslations("metaHubUI.components");
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const qualityColors = {
    GREEN: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
    YELLOW: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
    RED: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
    NEUTRAL: { bg: "bg-[#f5f5dc]/10", text: "text-[#f5f5dc]/60", border: "border-[#f5f5dc]/10" },
  };

  const quality = qualityRating ? qualityColors[qualityRating] : qualityColors.NEUTRAL;

  if (!mounted) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-3xl"
    >
      {/* Pulsing Glow Effect for Connected Status */}
      {connected && (
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl animate-pulse"
          aria-hidden
        />
      )}

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
                <MessageSquare className="h-8 w-8 text-[#d4af37]" />
              </div>
              {connected && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </span>
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
                {t("whatsappBusinessAccount")}
              </h2>
              <p className="mt-1 text-sm text-[#f5f5dc]/60">
                {connected ? t("connected") : t("notConnected")}
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col items-end gap-2">
            {/* Connection Status */}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
                connected
                  ? "bg-emerald-500/15 border border-emerald-500/30"
                  : "bg-amber-500/15 border border-amber-500/30"
              }`}
            >
              {connected ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
              <span
                className={`text-xs font-semibold ${connected ? "text-emerald-400" : "text-amber-400"}`}
              >
                {connected ? t("badgeConnected") : t("setupRequired")}
              </span>
            </div>

            {/* Verification Badge */}
            {verificationStatus === "verified" && (
              <div className="flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/15 px-3 py-1.5">
                <Shield className="h-4 w-4 text-[#d4af37]" />
                <span className="text-xs font-semibold text-[#d4af37]">{t("metaVerified")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              {t("wabaId")}
            </p>
            <p className="mt-1 font-mono text-sm text-[#f5f5dc]">{wabaIdMasked}</p>
          </div>
          <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              {t("phoneNumberId")}
            </p>
            <p className="mt-1 font-mono text-sm text-[#f5f5dc]">{phoneIdMasked}</p>
          </div>
          <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              {t("accessToken")}
            </p>
            <p className={`mt-1 text-sm font-semibold ${tokenConfigured ? "text-emerald-400" : "text-amber-400"}`}>
              {tokenConfigured ? t("configured") : t("missing")}
            </p>
          </div>
          <div className={`rounded-xl border ${quality.border} ${quality.bg} p-4`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              {t("qualityRating")}
            </p>
            <p className={`mt-1 text-sm font-semibold ${quality.text}`}>
              {qualityRating ?? t("notAvailable")}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANALYTICS PULSE SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

type AnalyticsPulseProps = {
  inbound24h: number | null;
  outbound24h: number | null;
  events24h: number | null;
  latencyMs?: number | null;
};

function MagentaSparkline() {
  return (
    <svg className="h-8 w-full" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sparkline-magenta" x1="0" y1="0" x2="100%" y2="0">
          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#e11d48" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path
        d="M0 18 Q8 12, 15 14 T30 10 T45 16 T60 8 T75 12 T90 6 T100 10"
        fill="none"
        stroke="url(#sparkline-magenta)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartbeatWave() {
  return (
    <svg className="h-8 w-full" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="heartbeat-grad" x1="0" y1="0" x2="100%" y2="0">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#d4af37" stopOpacity="1" />
          <stop offset="100%" stopColor="#f9d976" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M0 12 L20 12 L25 12 L30 4 L35 20 L40 8 L45 16 L50 12 L100 12"
        fill="none"
        stroke="url(#heartbeat-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CircularProgress({
  value,
  max,
  color,
}: {
  value: number | null;
  max: number;
  color: string;
}) {
  const hasValue = value !== null && Number.isFinite(value);
  const percentage = hasValue && max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-20 w-20">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="rgba(245, 245, 220, 0.1)"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-[#f5f5dc]">
          {hasValue ? `${Math.round(percentage)}%` : "--"}
        </span>
      </div>
    </div>
  );
}

export function AnalyticsPulseSection({
  inbound24h,
  outbound24h,
  events24h,
  latencyMs = null,
}: AnalyticsPulseProps) {
  const t = useTranslations("metaHubUI.components");
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const formatCount = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return "--";
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const hasTraffic = inbound24h !== null || outbound24h !== null;
  const throughput = hasTraffic ? (inbound24h ?? 0) + (outbound24h ?? 0) : null;
  const hasEvents = events24h !== null;
  const deliveryValue = null; // no reliable numerator/denominator available yet
  const deliveryLabel = !hasEvents
    ? t("noData")
    : (events24h ?? 0) === 0
      ? t("noEventsYet")
      : t("deliveryDataNotAvailable");
  const latencyBadgeLabel = latencyMs === null ? t("noData") : t("healthy");
  const latencyBadgeClass =
    latencyMs === null
      ? "rounded-full bg-[#f5f5dc]/10 px-2 py-1 text-[9px] font-bold uppercase text-[#f5f5dc]/60"
      : "rounded-full bg-emerald-500/15 px-2 py-1 text-[9px] font-bold uppercase text-emerald-400";

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {/* API Throughput */}
      <motion.div
        variants={cardVariants}
        className="group relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl transition-all duration-300 hover:border-[#e11d48]/40 hover:shadow-[0_0_24px_rgba(225,29,72,0.15)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e11d48]/20 to-[#e11d48]/5">
            <TrendingUp className="h-5 w-5 text-[#e11d48]" />
          </div>
          <Zap className="h-4 w-4 text-[#f5f5dc]/20 group-hover:text-[#e11d48] transition-colors" />
        </div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
          {t("apiThroughput")}
        </p>
        <p className="mt-1 text-2xl font-bold text-[#f5f5dc]">
          {formatCount(throughput)}
        </p>
        <p className="text-xs text-[#f5f5dc]/40">
          {throughput === null ? t("noDataYet") : t("requestsPer24h")}
        </p>
        {throughput !== null && (
          <div className="mt-3">
            <MagentaSparkline />
          </div>
        )}
      </motion.div>

      {/* Message Delivery Rate */}
      <motion.div
        variants={cardVariants}
        className="group relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl transition-all duration-300 hover:border-[#d4af37]/40 hover:shadow-[0_0_24px_rgba(212,175,55,0.15)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10">
              <Send className="h-5 w-5 text-[#d4af37]" />
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              {t("deliveryRate")}
            </p>
            <p className="mt-1 text-xs text-[#f5f5dc]/40">{deliveryLabel}</p>
          </div>
          <CircularProgress value={deliveryValue} max={100} color="#d4af37" />
        </div>
      </motion.div>

      {/* Inbound / Outbound */}
      <motion.div
        variants={cardVariants}
        className="group relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase text-[#f5f5dc]/40">{t("in")}</span>
            </div>
            <p className="mt-1 text-xl font-bold text-emerald-400">{formatCount(inbound24h)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#d4af37]" />
              <span className="text-[10px] font-semibold uppercase text-[#f5f5dc]/40">{t("out")}</span>
            </div>
            <p className="mt-1 text-xl font-bold text-[#d4af37]">{formatCount(outbound24h)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#f5f5dc]/40">
          {hasTraffic ? t("messagesIn24h") : t("noDataYet")}
        </p>
      </motion.div>

      {/* Latency Monitor */}
      <motion.div
        variants={cardVariants}
        className="group relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl transition-all duration-300 hover:border-[#d4af37]/40 hover:shadow-[0_0_24px_rgba(212,175,55,0.15)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10">
            <Clock className="h-5 w-5 text-[#d4af37]" />
          </div>
          <span className={latencyBadgeClass}>{latencyBadgeLabel}</span>
        </div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
          {t("apiLatency")}
        </p>
        <p className="mt-1 text-2xl font-bold text-[#f5f5dc]">
          {latencyMs === null ? "--" : `${latencyMs}ms`}
        </p>
        {latencyMs !== null && (
          <div className="mt-3">
            <HeartbeatWave />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════
   QUICK ACTIONS GRID
   ═══════════════════════════════════════════════════════════════════════════ */

type QuickAction = {
  label: string;
  href: string;
  icon: React.ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  helper?: string;
  ctaHref?: string;
};

export function QuickActionsGrid({
  basePath,
  allowTemplates,
  allowSend,
  allowWebhooks,
  whatsappConnected,
}: {
  basePath: string;
  allowTemplates: boolean;
  allowSend: boolean;
  allowWebhooks: boolean;
  whatsappConnected: boolean;
}) {
  const t = useTranslations("metaHubUI.components");
  const actions: QuickAction[] = [];
  const upgradeHref = "/pricing";

  if (!whatsappConnected) {
    actions.push({
      label: t("connectWhatsApp"),
      href: `${basePath}/connections`,
      icon: <Settings className="h-4 w-4" />,
      variant: "primary",
    });
    actions.push({
      label: t("viewEvents"),
      href: `${basePath}/webhooks`,
      icon: <Eye className="h-4 w-4" />,
      variant: "secondary",
      disabled: !allowWebhooks,
      helper: !allowWebhooks ? t("upgradeToUnlock") : undefined,
      ctaHref: upgradeHref,
    });
  } else {
    if (allowTemplates) {
      actions.push({
        label: t("syncTemplates"),
        href: `${basePath}/messaging/whatsapp`,
        icon: <RefreshCw className="h-4 w-4" />,
        variant: "primary",
      });
    } else {
      actions.push({
        label: t("syncTemplates"),
        href: `${basePath}/messaging/whatsapp`,
        icon: <RefreshCw className="h-4 w-4" />,
        variant: "primary",
        disabled: true,
        helper: t("upgradeRequired"),
        ctaHref: upgradeHref,
      });
    }
    actions.push({
      label: t("openInbox"),
      href: `${basePath}/messaging/whatsapp/inbox`,
      icon: <Inbox className="h-4 w-4" />,
      variant: "primary",
    });
    actions.push({
      label: t("testSend"),
      href: `${basePath}/messaging/whatsapp`,
      icon: <Send className="h-4 w-4" />,
      variant: "secondary",
      disabled: !allowSend,
      helper: !allowSend ? t("upgradeRequired") : undefined,
      ctaHref: upgradeHref,
    });
    actions.push({
      label: t("connections"),
      href: `${basePath}/connections`,
      icon: <Settings className="h-4 w-4" />,
      variant: "secondary",
    });
    actions.push({
      label: t("viewEvents"),
      href: `${basePath}/webhooks`,
      icon: <Eye className="h-4 w-4" />,
      variant: "secondary",
      disabled: !allowWebhooks,
      helper: !allowWebhooks ? t("upgradeToUnlock") : undefined,
      ctaHref: upgradeHref,
    });
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
          {t("quickActions")}
        </h3>
        <Zap className="h-4 w-4 text-[#d4af37]" />
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.disabled ? action.ctaHref ?? upgradeHref : action.href}
            aria-disabled={action.disabled}
            className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              action.variant === "primary"
                ? "bg-gradient-to-r from-[#d4af37]/15 to-[#f9d976]/5 text-[#d4af37] hover:from-[#d4af37]/25 hover:to-[#f9d976]/10"
                : "border border-[#f5f5dc]/10 text-[#f5f5dc]/70 hover:border-[#d4af37]/30 hover:text-[#f5f5dc]"
            } ${action.disabled ? "pointer-events-auto opacity-60" : ""}`}
          >
            <span className="flex items-center gap-3">
              {action.icon}
              <span className="flex flex-col">
                <span>{action.label}</span>
                {action.helper && (
                  <span className="text-[11px] font-normal text-[#f5f5dc]/50">{action.helper}</span>
                )}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CYBER-LOG CONSOLE
   ═══════════════════════════════════════════════════════════════════════════ */

export function CyberLogConsole({
  recentEvents,
  basePath,
}: {
  recentEvents: Array<{ id: string; type: string; receivedAt: string | null }>;
  basePath: string;
}) {
  const t = useTranslations("metaHubUI.components");
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const uniqueEvents = recentEvents.filter(
    (evt, index, arr) => arr.findIndex((candidate) => candidate.id === evt.id) === index,
  );

  const logs = uniqueEvents.map((evt) => ({
    id: evt.id,
    timestamp: evt.receivedAt,
    type: evt.type || "event",
    payload: t("viewDetailsInWebhooks"),
  }));

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return t("noTimestamp");
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return t("noTimestamp");
    return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const hasLogs = logs.length > 0;

  if (!mounted) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-[#d4af37]/20 bg-[#050a18]/90 backdrop-blur-3xl overflow-hidden"
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-[#f5f5dc]/10 bg-[#0a1229]/80 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#d4af37]" />
            <span className="text-xs font-semibold text-[#f5f5dc]/60">{t("cyberLogConsole")}</span>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="h-48 overflow-y-auto p-4 font-mono text-xs">
        {hasLogs ? (
          <>
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="mb-2 flex gap-3"
              >
                <span className="text-[#f5f5dc]/30">{formatTimestamp(log.timestamp)}</span>
                <span className="text-[#e11d48]">{log.type}</span>
                <span className="text-[#f5f5dc]/50 truncate">{log.payload}</span>
              </motion.div>
            ))}
            <div className="flex items-center gap-2 text-[#d4af37]">
              <span className="animate-pulse">{">>"}</span>
              <span className="text-[#f5f5dc]/30">{t("awaitingNextEvent")}</span>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-start justify-center gap-3 text-[#f5f5dc]/60">
            <p>{t("noWebhookEvents")}</p>
            <Link
              href={`${basePath}/webhooks`}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d4af37]/30 px-3 py-1.5 text-[11px] font-semibold text-[#d4af37] hover:border-[#d4af37]/50"
            >
              {t("openWebhookEvents")}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE GRID PREVIEW (PHONE-STYLE CARDS)
   ═══════════════════════════════════════════════════════════════════════════ */

type TemplateStatus = "approved" | "pending" | "rejected";

type TemplatePreviewProps = {
  approved: number | null;
  pending: number | null;
  rejected: number | null;
  basePath: string;
};

export function TemplateGridPreview({ approved, pending, rejected, basePath }: TemplatePreviewProps) {
  const t = useTranslations("metaHubUI.components");
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const statusStyles: Record<TemplateStatus, string> = {
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const total = (approved ?? 0) + (pending ?? 0) + (rejected ?? 0);
  const summary = [
    { label: t("approved"), count: approved ?? 0, status: "approved" as TemplateStatus },
    { label: t("pending"), count: pending ?? 0, status: "pending" as TemplateStatus },
    { label: t("rejected"), count: rejected ?? 0, status: "rejected" as TemplateStatus },
  ];

  if (!mounted) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
            {t("templateExplorer")}
          </h3>
          <p className="mt-1 text-xs text-[#f5f5dc]/40">
            {t("templateSummary", { approved: approved ?? 0, pending: pending ?? 0, rejected: rejected ?? 0 })}
          </p>
        </div>
        <Link
          href={`${basePath}/messaging/whatsapp`}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#d4af37] hover:underline"
        >
          {t("viewAll")}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-4 rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4">
          <p className="text-sm font-semibold text-[#f5f5dc]">{t("noTemplatesYet")}</p>
          <p className="mt-1 text-xs text-[#f5f5dc]/50">
            {t("syncTemplatesDesc")}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4 text-center"
            >
              <p className="text-xs uppercase tracking-wider text-[#f5f5dc]/40">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-[#f5f5dc]">{item.count}</p>
              <span
                className={`mt-3 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${statusStyles[item.status]}`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════
   CHANNELS GRID
   ═══════════════════════════════════════════════════════════════════════════ */

type Channel = {
  name: string;
  status: "live" | "beta" | "soon" | "locked";
  desc: string;
  stats: string[];
  href: string;
};

export function ChannelsGrid({ channels }: { channels: Channel[] }) {
  const t = useTranslations("metaHubUI.components");
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const statusIcons = {
    live: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    beta: <Activity className="h-4 w-4 text-[#d4af37]" />,
    soon: <Clock className="h-4 w-4 text-[#f5f5dc]/40" />,
    locked: <Lock className="h-4 w-4 text-red-300" />,
  };

  if (!mounted) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((c) => (
          <div key={c.name} className="h-32 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl"
    >
      <h3 className="text-sm font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
        {t("allChannels")}
      </h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <motion.div key={channel.name} variants={cardVariants}>
            <Link
              href={channel.href}
              className={`group block rounded-xl border p-4 transition-all duration-300 ${
                channel.status === "soon" || channel.status === "locked"
                  ? "border-[#f5f5dc]/10 bg-[#050a18]/40 grayscale-[30%]"
                  : "border-[#f5f5dc]/10 bg-[#050a18]/60 hover:border-[#d4af37]/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#f5f5dc]">{channel.name}</span>
                {statusIcons[channel.status]}
              </div>
              <p className="mt-2 text-xs text-[#f5f5dc]/50">{channel.desc}</p>
              <p className="mt-1 text-[10px] text-[#f5f5dc]/30">{channel.stats.join(" / ")}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
