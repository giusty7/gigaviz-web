"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
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
  qualityRating = "GREEN",
  verificationStatus = "verified",
}: WABAStatusHeroProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const qualityColors = {
    GREEN: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
    YELLOW: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
    RED: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  };

  const quality = qualityRating ? qualityColors[qualityRating] : qualityColors.GREEN;

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
                WhatsApp Business Account
              </h2>
              <p className="mt-1 text-sm text-[#f5f5dc]/60">
                {connected ? "Connected and receiving messages" : "Not connected yet"}
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
                {connected ? "CONNECTED" : "SETUP REQUIRED"}
              </span>
            </div>

            {/* Verification Badge */}
            {verificationStatus === "verified" && (
              <div className="flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/15 px-3 py-1.5">
                <Shield className="h-4 w-4 text-[#d4af37]" />
                <span className="text-xs font-semibold text-[#d4af37]">META VERIFIED</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              WABA ID
            </p>
            <p className="mt-1 font-mono text-sm text-[#f5f5dc]">{wabaIdMasked}</p>
          </div>
          <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              Phone Number ID
            </p>
            <p className="mt-1 font-mono text-sm text-[#f5f5dc]">{phoneIdMasked}</p>
          </div>
          <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              Access Token
            </p>
            <p className={`mt-1 text-sm font-semibold ${tokenConfigured ? "text-emerald-400" : "text-amber-400"}`}>
              {tokenConfigured ? "Configured" : "Missing"}
            </p>
          </div>
          <div className={`rounded-xl border ${quality.border} ${quality.bg} p-4`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
              Quality Rating
            </p>
            <p className={`mt-1 text-sm font-semibold ${quality.text}`}>
              {qualityRating || "—"}
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
  latencyMs?: number;
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

function CircularProgress({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
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
        <span className="text-lg font-bold text-[#f5f5dc]">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export function AnalyticsPulseSection({ inbound24h, outbound24h, latencyMs = 180 }: AnalyticsPulseProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const formatCount = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return "—";
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (!mounted) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
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
          API Throughput
        </p>
        <p className="mt-1 text-2xl font-bold text-[#f5f5dc]">
          {formatCount((inbound24h ?? 0) + (outbound24h ?? 0))}
        </p>
        <p className="text-xs text-[#f5f5dc]/40">requests / 24h</p>
        <div className="mt-3">
          <MagentaSparkline />
        </div>
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
              Delivery Rate
            </p>
            <p className="mt-1 text-xs text-[#f5f5dc]/40">Message success</p>
          </div>
          <CircularProgress value={98} max={100} color="#d4af37" />
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
              <span className="text-[10px] font-semibold uppercase text-[#f5f5dc]/40">In</span>
            </div>
            <p className="mt-1 text-xl font-bold text-emerald-400">{formatCount(inbound24h)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#d4af37]" />
              <span className="text-[10px] font-semibold uppercase text-[#f5f5dc]/40">Out</span>
            </div>
            <p className="mt-1 text-xl font-bold text-[#d4af37]">{formatCount(outbound24h)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#f5f5dc]/40">Messages in last 24h</p>
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
          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[9px] font-bold uppercase text-emerald-400">
            Healthy
          </span>
        </div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
          API Latency
        </p>
        <p className="mt-1 text-2xl font-bold text-[#f5f5dc]">{latencyMs}ms</p>
        <div className="mt-3">
          <HeartbeatWave />
        </div>
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
};

export function QuickActionsGrid({ basePath, allowTemplates, allowSend }: { 
  basePath: string; 
  allowTemplates: boolean;
  allowSend: boolean;
}) {
  const actions: QuickAction[] = [
    ...(allowTemplates ? [{
      label: "Sync Templates",
      href: `${basePath}/messaging/whatsapp`,
      icon: <RefreshCw className="h-4 w-4" />,
      variant: "primary" as const,
    }] : []),
    {
      label: "Open Inbox",
      href: `${basePath}/messaging/whatsapp/inbox`,
      icon: <Inbox className="h-4 w-4" />,
      variant: "primary" as const,
    },
    ...(allowSend ? [{
      label: "Test Send",
      href: `${basePath}/messaging/whatsapp`,
      icon: <Send className="h-4 w-4" />,
      variant: "secondary" as const,
    }] : []),
    {
      label: "Connections",
      href: `${basePath}/connections`,
      icon: <Settings className="h-4 w-4" />,
      variant: "secondary" as const,
    },
    {
      label: "View Events",
      href: `${basePath}/webhooks`,
      icon: <Eye className="h-4 w-4" />,
      variant: "secondary" as const,
    },
  ];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
          Quick Actions
        </h3>
        <Zap className="h-4 w-4 text-[#d4af37]" />
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              action.variant === "primary"
                ? "bg-gradient-to-r from-[#d4af37]/15 to-[#f9d976]/5 text-[#d4af37] hover:from-[#d4af37]/25 hover:to-[#f9d976]/10"
                : "border border-[#f5f5dc]/10 text-[#f5f5dc]/70 hover:border-[#d4af37]/30 hover:text-[#f5f5dc]"
            }`}
          >
            <span className="flex items-center gap-3">
              {action.icon}
              {action.label}
            </span>
            <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CYBER-LOG CONSOLE (SIMULATED TERMINAL)
   ═══════════════════════════════════════════════════════════════════════════ */

type LogEntry = {
  id: string;
  timestamp: string;
  type: string;
  payload: string;
};

const SIMULATED_LOGS: LogEntry[] = [
  { id: "1", timestamp: "2026-01-16T10:23:45Z", type: "webhook.message.received", payload: '{"from":"628123456789","type":"text"}' },
  { id: "2", timestamp: "2026-01-16T10:23:46Z", type: "webhook.message.status", payload: '{"status":"delivered","message_id":"wamid.xxx"}' },
  { id: "3", timestamp: "2026-01-16T10:23:47Z", type: "template.send.success", payload: '{"template":"order_confirm","to":"628987654321"}' },
  { id: "4", timestamp: "2026-01-16T10:23:48Z", type: "webhook.message.received", payload: '{"from":"628555123456","type":"image"}' },
  { id: "5", timestamp: "2026-01-16T10:23:49Z", type: "webhook.message.status", payload: '{"status":"read","message_id":"wamid.yyy"}' },
];

export function CyberLogConsole({ recentEvents }: { recentEvents: Array<{ id: string; type: string; receivedAt: string | null }> }) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // Use real events if available, otherwise use simulated logs
  const logs = recentEvents.length > 0 
    ? recentEvents.map((evt) => ({
        id: evt.id,
        timestamp: evt.receivedAt || new Date().toISOString(),
        type: evt.type || "event",
        payload: "{ ... }",
      }))
    : SIMULATED_LOGS;

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
            <span className="text-xs font-semibold text-[#f5f5dc]/60">CYBER-LOG CONSOLE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-semibold uppercase text-emerald-400">Live Stream</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="h-48 overflow-y-auto p-4 font-mono text-xs">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-2 flex gap-3"
          >
            <span className="text-[#f5f5dc]/30">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-[#e11d48]">{log.type}</span>
            <span className="text-[#f5f5dc]/50 truncate">{log.payload}</span>
          </motion.div>
        ))}
        <div className="flex items-center gap-2 text-[#d4af37]">
          <span className="animate-pulse">▋</span>
          <span className="text-[#f5f5dc]/30">Awaiting next event...</span>
        </div>
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
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const statusStyles: Record<TemplateStatus, string> = {
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const templates = [
    { name: "order_confirmation", status: "approved" as TemplateStatus },
    { name: "shipping_update", status: "approved" as TemplateStatus },
    { name: "welcome_message", status: "pending" as TemplateStatus },
    { name: "promo_campaign", status: "rejected" as TemplateStatus },
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
            Template Explorer
          </h3>
          <p className="mt-1 text-xs text-[#f5f5dc]/40">
            {approved ?? 0} approved • {pending ?? 0} pending • {rejected ?? 0} rejected
          </p>
        </div>
        <Link
          href={`${basePath}/messaging/whatsapp`}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#d4af37] hover:underline"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Phone-Style Preview Grid */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {templates.map((template) => (
          <div
            key={template.name}
            className="group relative rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-4 transition-all duration-300 hover:border-[#d4af37]/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] cursor-pointer"
          >
            {/* Phone Frame */}
            <div className="mx-auto h-24 w-14 rounded-lg border border-[#f5f5dc]/20 bg-[#0a1229] p-1.5">
              <div className="h-full w-full rounded bg-gradient-to-b from-[#f5f5dc]/5 to-transparent">
                <div className="flex flex-col gap-1 p-1.5">
                  <div className="h-1.5 w-6 rounded bg-[#f5f5dc]/20" />
                  <div className="h-1 w-8 rounded bg-[#f5f5dc]/10" />
                  <div className="h-1 w-5 rounded bg-[#f5f5dc]/10" />
                </div>
              </div>
            </div>

            {/* Template Info */}
            <p className="mt-3 text-center text-[10px] font-semibold text-[#f5f5dc] truncate">
              {template.name}
            </p>
            <div className="mt-2 flex justify-center">
              <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${statusStyles[template.status]}`}>
                {template.status}
              </span>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#050a18]/80 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-3 py-1.5 text-[10px] font-bold text-[#050a18]">
                Quick Edit
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHANNELS GRID
   ═══════════════════════════════════════════════════════════════════════════ */

type Channel = {
  name: string;
  status: "live" | "beta" | "soon";
  desc: string;
  stats: string[];
  href: string;
};

export function ChannelsGrid({ channels }: { channels: Channel[] }) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const statusIcons = {
    live: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    beta: <Activity className="h-4 w-4 text-[#d4af37]" />,
    soon: <Clock className="h-4 w-4 text-[#f5f5dc]/40" />,
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
        All Channels
      </h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <motion.div key={channel.name} variants={cardVariants}>
            <Link
              href={channel.href}
              className={`group block rounded-xl border p-4 transition-all duration-300 ${
                channel.status === "soon"
                  ? "border-[#f5f5dc]/10 bg-[#050a18]/40 grayscale-[30%]"
                  : "border-[#f5f5dc]/10 bg-[#050a18]/60 hover:border-[#d4af37]/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#f5f5dc]">{channel.name}</span>
                {statusIcons[channel.status]}
              </div>
              <p className="mt-2 text-xs text-[#f5f5dc]/50">{channel.desc}</p>
              <p className="mt-1 text-[10px] text-[#f5f5dc]/30">{channel.stats.join(" • ")}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
