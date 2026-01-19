"use client";

import { useSyncExternalStore } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Radio,
  Copy,
  Loader2,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Zap,
  Activity,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

const slideOverVariants: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.2 } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type WebhookEvent = {
  id: string;
  channel: string;
  event_type: string | null;
  external_event_id: string | null;
  received_at: string | null;
  processed_at: string | null;
  error_text: string | null;
  payload_json: Record<string, unknown>;
};

export type WebhookStats = {
  total24h: number;
  errors24h: number;
  lastEventAt: string | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   RADAR HEADER - Pulse Animation with Status
   ═══════════════════════════════════════════════════════════════════════════ */

interface RadarHeaderProps {
  isListening: boolean;
  webhookUrl: string;
  lastEventAt: string | null;
  onCopy: (text: string) => void;
}

export function RadarHeader({ isListening, webhookUrl, lastEventAt, onCopy }: RadarHeaderProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <div className="h-48 animate-pulse rounded-3xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18] p-8"
    >
      {/* Cyber-Batik Kawung Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='20' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3Ccircle cx='30' cy='30' r='10' fill='none' stroke='%23d4af37' stroke-width='0.3'/%3E%3Ccircle cx='30' cy='30' r='5' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3Ccircle cx='10' cy='10' r='5' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3Ccircle cx='50' cy='10' r='5' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3Ccircle cx='10' cy='50' r='5' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3Ccircle cx='50' cy='50' r='5' fill='none' stroke='%23d4af37' stroke-width='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
        {/* Radar Pulse Animation */}
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24">
            {/* Concentric ripple circles */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-[#d4af37]"
                initial={{ scale: 0.3, opacity: 0.8 }}
                animate={{
                  scale: [0.3, 1.2],
                  opacity: [0.8, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut",
                }}
              />
            ))}
            {/* Center radar dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="h-8 w-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f9d976] shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            {/* Rotating sweep line */}
            <motion.div
              className="absolute left-1/2 top-1/2 h-12 w-0.5 origin-bottom bg-gradient-to-t from-[#d4af37] to-transparent"
              style={{ marginLeft: "-1px", marginTop: "-48px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-sm font-bold tracking-[0.2em] text-[#f5f5dc]/60">
                SYSTEM STATUS:
              </span>
              <div className="flex items-center gap-2">
                <motion.div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    isListening ? "bg-emerald-400" : "bg-[#e11d48]"
                  )}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span
                  className={cn(
                    "text-lg font-bold tracking-wider",
                    isListening ? "text-emerald-400" : "text-[#e11d48]"
                  )}
                >
                  {isListening ? "LISTENING" : "OFFLINE"}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#f5f5dc]/50">
              Real-time monitoring of Meta webhook events
            </p>
            {lastEventAt && (
              <p className="mt-1 text-xs text-[#f5f5dc]/40">
                Last event: {new Date(lastEventAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Webhook URL Terminal Box */}
        <div className="w-full max-w-md">
          <p className="mb-2 text-xs font-semibold tracking-wider text-[#d4af37]">
            WEBHOOK ENDPOINT
          </p>
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#d4af37]/40 bg-[#050a18] p-3">
            <Radio className="h-4 w-4 shrink-0 text-[#d4af37]" />
            <code className="flex-1 truncate font-mono text-sm text-[#f9d976]">
              {webhookUrl}
            </code>
            <button
              onClick={() => onCopy(webhookUrl)}
              className="shrink-0 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 p-2 text-[#f9d976] transition-all hover:bg-[#d4af37]/20 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEALTH METRICS CARDS
   ═══════════════════════════════════════════════════════════════════════════ */

interface MetricsCardsProps {
  successRate: number | null;
  avgLatencyMs: number | null;
  total24h: number;
  errors24h: number;
}

export function MetricsCards({ successRate, avgLatencyMs, total24h, errors24h }: MetricsCardsProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // Circular gauge for success rate
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const hasSuccessRate = typeof successRate === "number";
  const successRateValue = hasSuccessRate ? successRate : 0;
  const strokeDashoffset = circumference - (successRateValue / 100) * circumference;
  const successRateLabel = hasSuccessRate ? `${successRate.toFixed(1)}%` : "--";
  const latencyLabel = avgLatencyMs === null ? "--" : `${avgLatencyMs}ms`;
  const latencyHint = avgLatencyMs === null ? "No data yet" : "Target: < 200ms";

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
      className="grid gap-4 md:grid-cols-4"
    >
      {/* Success Rate Gauge */}
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#051a1a] p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-emerald-400">SUCCESS RATE</p>
            <p className="mt-1 text-3xl font-bold text-[#f5f5dc]">{successRateLabel}</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/50">
              {hasSuccessRate ? "Last 24h" : "No data yet"}
            </p>
          </div>
          <div className="relative h-20 w-20">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(16,185,129,0.2)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2
                className={cn("h-6 w-6", hasSuccessRate ? "text-emerald-400" : "text-[#f5f5dc]/40")}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Latency Tracker */}
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#0d1a2a] p-5"
      >
        <p className="text-xs font-semibold tracking-wider text-[#d4af37]">AVG LATENCY</p>
        <p className="mt-1 text-3xl font-bold text-[#f5f5dc]">{latencyLabel}</p>
        <div className="mt-3">
          {/* Mini latency chart */}
          <svg className="h-10 w-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <defs>
              <linearGradient id="latencyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#d4af37" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {avgLatencyMs === null ? (
              <path
                d="M0,15 L100,15"
                fill="none"
                stroke="rgba(245, 245, 220, 0.2)"
                strokeWidth="2"
              />
            ) : (
              <motion.path
                d="M0,20 Q10,15 20,18 T40,12 T60,20 T80,8 T100,15"
                fill="none"
                stroke="url(#latencyGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5 }}
              />
            )}
          </svg>
        </div>
        <p className="mt-1 text-xs text-[#f5f5dc]/50">{latencyHint}</p>
      </motion.div>

      {/* Events 24h */}
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#0d1a2a] p-5"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#d4af37]" />
          <p className="text-xs font-semibold tracking-wider text-[#d4af37]">EVENTS 24H</p>
        </div>
        <p className="mt-2 text-4xl font-bold text-[#f9d976]">{total24h}</p>
        <p className="mt-1 text-xs text-[#f5f5dc]/50">Total received</p>
      </motion.div>

      {/* Errors 24h */}
      <motion.div
        variants={cardVariants}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5",
          errors24h > 0
            ? "border-[#e11d48]/40 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#1a0a14]"
            : "border-emerald-500/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#051a1a]"
        )}
      >
        <div className="flex items-center gap-2">
          <XCircle className={cn("h-4 w-4", errors24h > 0 ? "text-[#e11d48]" : "text-emerald-400")} />
          <p
            className={cn(
              "text-xs font-semibold tracking-wider",
              errors24h > 0 ? "text-[#e11d48]" : "text-emerald-400"
            )}
          >
            ERRORS 24H
          </p>
        </div>
        <p
          className={cn(
            "mt-2 text-4xl font-bold",
            errors24h > 0 ? "text-[#e11d48]" : "text-emerald-400"
          )}
        >
          {errors24h}
        </p>
        <p className="mt-1 text-xs text-[#f5f5dc]/50">
          {errors24h === 0 ? "All systems nominal" : "Requires attention"}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FILTER PILLS
   ═══════════════════════════════════════════════════════════════════════════ */

interface FilterPillsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const FILTERS = [
  { key: "all", label: "All Events" },
  { key: "messages", label: "Messages" },
  { key: "statuses", label: "Status Updates" },
  { key: "errors", label: "Errors" },
];

export function FilterPills({ activeFilter, onFilterChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <motion.button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
            activeFilter === filter.key
              ? "border-[#d4af37] bg-[#d4af37]/20 text-[#f9d976] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              : "border-[#d4af37]/30 bg-[#050a18] text-[#f5f5dc]/60 hover:border-[#d4af37]/60 hover:text-[#f5f5dc]"
          )}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {filter.label}
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEST WEBHOOK BUTTON
   ═══════════════════════════════════════════════════════════════════════════ */

interface TestWebhookButtonProps {
  onTest: () => Promise<void>;
  loading: boolean;
  disabled?: boolean;
}

export function TestWebhookButton({ onTest, loading, disabled = false }: TestWebhookButtonProps) {
  return (
    <motion.button
      onClick={onTest}
      disabled={loading || disabled}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-[#d4af37] bg-gradient-to-r from-[#d4af37]/10 via-[#f9d976]/10 to-[#d4af37]/10 px-6 py-3 font-semibold text-[#f9d976] transition-all",
        "hover:from-[#d4af37]/20 hover:via-[#f9d976]/20 hover:to-[#d4af37]/20 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Sonar ping effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-[#d4af37]"
        initial={{ scale: 1, opacity: 0 }}
        whileHover={{
          scale: [1, 1.3],
          opacity: [0.5, 0],
          transition: { duration: 0.8, repeat: Infinity },
        }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Pinging...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Test Webhook Ping
          </>
        )}
      </span>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE EVENT STREAM
   ═══════════════════════════════════════════════════════════════════════════ */

interface EventStreamProps {
  events: WebhookEvent[];
  onEventClick: (event: WebhookEvent) => void;
}

function getEventIcon(eventType: string | null, hasError: boolean) {
  if (hasError) return <XCircle className="h-5 w-5 text-[#e11d48]" />;
  if (!eventType) return <Activity className="h-5 w-5 text-[#d4af37]" />;

  const type = eventType.toLowerCase();
  if (type.includes("message")) return <MessageSquare className="h-5 w-5 text-emerald-400" />;
  if (type.includes("delivered") || type.includes("read") || type.includes("sent")) {
    return <CheckCircle2 className="h-5 w-5 text-[#d4af37]" />;
  }
  if (type.includes("error") || type.includes("failed")) {
    return <XCircle className="h-5 w-5 text-[#e11d48]" />;
  }
  return <Activity className="h-5 w-5 text-[#d4af37]" />;
}

export function EventStream({ events, onEventClick }: EventStreamProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d4af37]/30 bg-[#050a18]/50 px-8 py-16 text-center"
      >
        <Radio className="mb-4 h-12 w-12 text-[#d4af37]/40" />
        <p className="text-lg font-semibold text-[#f5f5dc]">No Events Yet</p>
        <p className="mt-2 text-sm text-[#f5f5dc]/50">
          Waiting for webhook events from Meta Cloud API...
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      <AnimatePresence mode="popLayout">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onEventClick(event)}
            className={cn(
              "group cursor-pointer rounded-xl border p-4 transition-all",
              event.error_text
                ? "border-[#e11d48]/30 bg-[#e11d48]/5 hover:border-[#e11d48]/50"
                : "border-[#d4af37]/20 bg-[#0a1229]/60 hover:border-[#d4af37]/40 hover:bg-[#0a1229]/80"
            )}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  event.error_text ? "bg-[#e11d48]/20" : "bg-[#d4af37]/10"
                )}
              >
                {getEventIcon(event.event_type, Boolean(event.error_text))}
              </div>

              {/* Event Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[#f9d976]">
                    {event.event_type ?? "unknown"}
                  </span>
                  {event.error_text && (
                    <span className="rounded-full bg-[#e11d48]/20 px-2 py-0.5 text-xs text-[#e11d48]">
                      ERROR
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-[#f5f5dc]/50">
                  {event.external_event_id ?? event.id}
                </p>
              </div>

              {/* Timestamp */}
              <div className="shrink-0 text-right">
                <p className="text-sm text-[#f5f5dc]/70">
                  {event.received_at
                    ? new Date(event.received_at).toLocaleTimeString()
                    : "-"}
                </p>
                <p className="text-xs text-[#f5f5dc]/40">
                  {event.received_at
                    ? new Date(event.received_at).toLocaleDateString()
                    : ""}
                </p>
              </div>

              {/* Expand indicator */}
              <ChevronRight className="h-5 w-5 shrink-0 text-[#f5f5dc]/30 transition-transform group-hover:translate-x-1 group-hover:text-[#d4af37]" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAYLOAD INSPECTOR - Slide-over Panel
   ═══════════════════════════════════════════════════════════════════════════ */

interface PayloadInspectorProps {
  event: WebhookEvent | null;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export function PayloadInspector({ event, onClose, onCopy }: PayloadInspectorProps) {
  if (!event) return null;

  const formattedPayload = JSON.stringify(event.payload_json, null, 2);

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#050a18]/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            variants={slideOverVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-2xl overflow-hidden border-l border-[#d4af37]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#f9d976]">Payload Inspector</h3>
                <p className="text-sm text-[#f5f5dc]/50">
                  {event.event_type ?? "Event"} • {event.id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg border border-[#d4af37]/30 p-2 text-[#f5f5dc]/60 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metadata */}
            <div className="border-b border-[#d4af37]/20 px-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#f5f5dc]/50">Event Type</p>
                  <p className="mt-1 font-mono text-sm text-[#f9d976]">{event.event_type ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#f5f5dc]/50">Received At</p>
                  <p className="mt-1 text-sm text-[#f5f5dc]">
                    {event.received_at ? new Date(event.received_at).toLocaleString() : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#f5f5dc]/50">Processed At</p>
                  <p className="mt-1 text-sm text-[#f5f5dc]">
                    {event.processed_at ? new Date(event.processed_at).toLocaleString() : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#f5f5dc]/50">Channel</p>
                  <p className="mt-1 text-sm text-[#f5f5dc]">{event.channel}</p>
                </div>
              </div>
              {event.error_text && (
                <div className="mt-4 rounded-lg border border-[#e11d48]/40 bg-[#e11d48]/10 p-3">
                  <p className="text-xs font-semibold text-[#e11d48]">Error</p>
                  <p className="mt-1 text-sm text-[#e11d48]/80">{event.error_text}</p>
                </div>
              )}
            </div>

            {/* Payload Code Block */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wider text-[#d4af37]">JSON PAYLOAD</p>
                <button
                  onClick={() => onCopy(formattedPayload)}
                  className="flex items-center gap-1 rounded-lg border border-[#d4af37]/30 px-3 py-1.5 text-xs text-[#f9d976] hover:bg-[#d4af37]/10"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <div className="rounded-xl border border-[#d4af37]/20 bg-[#050a18] p-4">
                <pre className="max-h-[60vh] overflow-auto font-mono text-xs leading-relaxed text-[#f5f5dc]/80">
                  {formattedPayload}
                </pre>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumWebhooksFooter() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-8 border-t border-[#d4af37]/20 pt-6 text-center"
    >
      <div className="flex items-center justify-center gap-2 text-xs text-[#f5f5dc]/40">
        <Shield className="h-4 w-4 text-[#d4af37]/60" />
        <span>Monitoring Saraf Digital — Gigaviz Imperium by PT Glorious Victorious</span>
      </div>
    </motion.div>
  );
}
