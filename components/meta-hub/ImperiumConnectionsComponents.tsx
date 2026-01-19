"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Shield,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Terminal,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  ExternalLink,
  Loader2,
  Lock,
  Server,
  Radio,
  Sparkles,
  Building2,
  Users,
  Instagram,
  TrendingUp,
  BarChart3,
  MousePointerClick,
  Send,
  CheckCheck,
  Wifi,
  Globe,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
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

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.08, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   NEURAL LINK HERO - SVG Animation with traveling gold light pulse
   ═══════════════════════════════════════════════════════════════════════════ */

type ConnectionStatus = "connected" | "disconnected" | "syncing";

interface NeuralLinkHeroProps {
  status: ConnectionStatus;
  wabaId?: string | null;
  phoneNumberId?: string | null;
  displayName?: string | null;
  tokenSet: boolean;
}

export function NeuralLinkHero({
  status,
  wabaId,
  phoneNumberId,
  displayName,
  tokenSet,
}: NeuralLinkHeroProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const orbColors = {
    connected: { glow: "#10b981", core: "#34d399", ring: "#059669" },
    disconnected: { glow: "#e11d48", core: "#f43f5e", ring: "#be123c" },
    syncing: { glow: "#eab308", core: "#facc15", ring: "#ca8a04" },
  };

  const statusLabels = {
    connected: "Neural Link Active",
    disconnected: "Awaiting Connection",
    syncing: "Synchronizing...",
  };

  const colors = orbColors[status];

  if (!mounted) {
    return (
      <div className="relative h-80 animate-pulse rounded-3xl border border-[#d4af37]/20 bg-[#0a1229]/80" />
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18] p-8"
    >
      {/* Cyber-Batik Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] batik-overlay"
      />

      <div className="relative z-10 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: Gigaviz Core Node */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl border-2 border-[#d4af37]/60 bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 p-4 shadow-[0_0_40px_rgba(212,175,55,0.3)]">
              <Server className="h-full w-full text-[#f9d976]" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl border border-[#d4af37]/40"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold tracking-wider text-[#f9d976]">GIGAVIZ CORE</p>
            <p className="text-xs text-[#f5f5dc]/60">Secure Infrastructure</p>
          </div>
        </div>

        {/* Center: Neural Connection Line with traveling pulse */}
        <div className="relative flex flex-1 items-center justify-center py-8 lg:py-0">
          <svg
            className="h-4 w-full max-w-xs"
            viewBox="0 0 200 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Base line */}
            <line
              x1="0"
              y1="8"
              x2="200"
              y2="8"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Traveling pulse */}
            <motion.circle
              cx="0"
              cy="8"
              r="4"
              fill="#d4af37"
              animate={{ cx: [0, 200, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <animate
                attributeName="opacity"
                values="1;0.5;1"
                dur="3s"
                repeatCount="indefinite"
              />
            </motion.circle>
            {/* Glow effect following the pulse */}
            <motion.circle
              cx="0"
              cy="8"
              r="8"
              fill="none"
              stroke="#d4af37"
              strokeWidth="1"
              opacity="0.3"
              animate={{ cx: [0, 200, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#f9d976" stopOpacity="1" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Status Orb - 3D Glowing Sphere */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="relative h-16 w-16"
              variants={pulseVariants}
              animate="pulse"
            >
              {/* Outer glow */}
              <div
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: colors.glow, opacity: 0.4 }}
              />
              {/* Ring */}
              <div
                className="absolute inset-1 rounded-full border-2"
                style={{ borderColor: colors.ring }}
              />
              {/* Core sphere */}
              <div
                className="absolute inset-3 rounded-full shadow-lg"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${colors.core}, ${colors.glow})`,
                  boxShadow: `0 0 30px ${colors.glow}, inset 0 0 20px rgba(255,255,255,0.3)`,
                }}
              />
              {/* Highlight */}
              <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-white/60" />
            </motion.div>
          </div>
        </div>

        {/* Right: Meta Cloud API Node */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl border-2 border-blue-500/60 bg-gradient-to-br from-blue-600/20 to-blue-400/10 p-4 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              <Radio className="h-full w-full text-blue-400" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl border border-blue-500/40"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold tracking-wider text-blue-400">META CLOUD API</p>
            <p className="text-xs text-[#f5f5dc]/60">WhatsApp Business</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <motion.div
        className="relative z-10 mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: colors.core }}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span
            className="text-lg font-bold tracking-wide"
            style={{ color: colors.core }}
          >
            {statusLabels[status]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {wabaId && (
            <div className="rounded-lg border border-[#d4af37]/30 bg-[#0a1229]/80 px-3 py-1.5">
              <span className="text-[#f5f5dc]/60">WABA:</span>{" "}
              <span className="font-mono text-[#f9d976]">{wabaId}</span>
            </div>
          )}
          {phoneNumberId && (
            <div className="rounded-lg border border-[#d4af37]/30 bg-[#0a1229]/80 px-3 py-1.5">
              <span className="text-[#f5f5dc]/60">Phone:</span>{" "}
              <span className="font-mono text-[#f9d976]">{phoneNumberId}</span>
            </div>
          )}
          {displayName && (
            <div className="rounded-lg border border-[#d4af37]/30 bg-[#0a1229]/80 px-3 py-1.5">
              <span className="text-[#f5f5dc]/60">Name:</span>{" "}
              <span className="text-[#f5f5dc]">{displayName}</span>
            </div>
          )}
          <div
            className={cn(
              "rounded-lg border px-3 py-1.5",
              tokenSet
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            )}
          >
            <Lock className="mr-1 inline h-3 w-3" />
            {tokenSet ? "Token Secured" : "Token Missing"}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INFRASTRUCTURE GRID - Bento Style Cards
   ═══════════════════════════════════════════════════════════════════════════ */

interface VaultCardProps {
  tokenSet: boolean;
  wabaId?: string | null;
  phoneNumberId?: string | null;
  onCopy: (text: string, label: string) => void;
  onTestConnection?: () => void;
  testing?: boolean;
  testDisabled?: boolean;
  testDisabledReason?: string;
}

export function VaultCard({
  tokenSet,
  wabaId,
  phoneNumberId,
  onCopy,
  onTestConnection,
  testing = false,
  testDisabled = false,
  testDisabledReason,
}: VaultCardProps) {
  const [showWaba, setShowWaba] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-2xl border-2 border-[#d4af37]/40 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#0d1a3a] p-6"
    >
      {/* Gold corner accent */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent blur-2xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10">
            <Shield className="h-5 w-5 text-[#f9d976]" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-[#f9d976]">SECURE VAULT</h3>
            <p className="text-xs text-[#f5f5dc]/50">Encrypted Credentials</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* WABA ID */}
          <div className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/80 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-[#f5f5dc]/60">WABA ID</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowWaba(!showWaba)}
                  title="Toggle visibility"
                  className="rounded p-1 text-[#f5f5dc]/60 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
                >
                  {showWaba ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                {wabaId && (
                  <button
                    onClick={() => onCopy(wabaId, "WABA ID")}
                    title="Copy WABA ID"
                    className="rounded p-1 text-[#f5f5dc]/60 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="font-mono text-sm text-[#f5f5dc]">
              {wabaId ? (showWaba ? wabaId : "••••••••••••") : "Not configured"}
            </p>
          </div>

          {/* Phone Number ID */}
          <div className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/80 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-[#f5f5dc]/60">Phone Number ID</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPhone(!showPhone)}
                  title="Toggle visibility"
                  className="rounded p-1 text-[#f5f5dc]/60 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
                >
                  {showPhone ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                {phoneNumberId && (
                  <button
                    onClick={() => onCopy(phoneNumberId, "Phone Number ID")}
                    title="Copy Phone Number ID"
                    className="rounded p-1 text-[#f5f5dc]/60 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="font-mono text-sm text-[#f5f5dc]">
              {phoneNumberId ? (showPhone ? phoneNumberId : "••••••••••••") : "Not configured"}
            </p>
          </div>

          {/* Token Status */}
          <div
            className={cn(
              "flex items-center justify-between rounded-xl border p-3",
              tokenSet
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/30 bg-red-500/5"
            )}
          >
            <div className="flex items-center gap-2">
              <Lock className={cn("h-4 w-4", tokenSet ? "text-emerald-400" : "text-red-400")} />
              <span className="text-sm text-[#f5f5dc]">Access Token</span>
            </div>
            <span
              className={cn(
                "text-xs font-semibold",
                tokenSet ? "text-emerald-400" : "text-red-400"
              )}
            >
              {tokenSet ? "SECURED" : "MISSING"}
            </span>
          </div>
          {onTestConnection && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onTestConnection}
              disabled={testDisabled || testing}
              className="w-full border-[#d4af37]/40 text-[#f9d976] hover:bg-[#d4af37]/10"
            >
              {testing ? "Testing..." : "Test connection"}
            </Button>
          )}
          {testDisabledReason && (
            <p className="mt-2 text-xs text-[#f5f5dc]/50">{testDisabledReason}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BUSINESS ASSET VAULT - Meta Business Intelligence
   Justifies business_management permission
   ═══════════════════════════════════════════════════════════════════════════ */

interface BusinessAssetVaultProps {
  businessManagerId?: string | null;
  businessName?: string | null;
  verificationStatus?: "verified" | "pending" | "not_verified" | null;
  linkedAssets?: {
    facebookPages?: number | null;
    instagramAccounts?: number | null;
    systemUsers?: number | null;
  } | null;
  onCopy: (text: string, label: string) => void;
}

export function BusinessAssetVault({
  businessManagerId,
  businessName,
  verificationStatus = null,
  linkedAssets = null,
  onCopy,
}: BusinessAssetVaultProps) {
  const [showBmId, setShowBmId] = useState(false);
  const hasLinkedAssets = linkedAssets !== null && linkedAssets !== undefined;
  const getAssetCount = (value?: number | null) => (hasLinkedAssets ? String(value ?? 0) : "--");
  const statusKey =
    verificationStatus === "verified" ||
    verificationStatus === "pending" ||
    verificationStatus === "not_verified"
      ? verificationStatus
      : null;

  const verificationStyles = {
    verified: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/40",
      text: "text-emerald-400",
      icon: <BadgeCheck className="h-4 w-4" />,
      label: "Verified",
    },
    pending: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/40",
      text: "text-amber-400",
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Pending Verification",
    },
    not_verified: {
      bg: "bg-red-500/10",
      border: "border-red-500/40",
      text: "text-red-400",
      icon: <XCircle className="h-4 w-4" />,
      label: "Not Verified",
    },
  };

  const status = statusKey
    ? verificationStyles[statusKey]
    : {
        bg: "bg-[#0a1229]/60",
        border: "border-[#f5f5dc]/20",
        text: "text-[#f5f5dc]/60",
        icon: <AlertTriangle className="h-4 w-4" />,
        label: "Not configured",
      };

  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#0a1535] p-6"
    >
      {/* Blue corner accent */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10">
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-blue-400">META BUSINESS INTELLIGENCE</h3>
            <p className="text-xs text-[#f5f5dc]/50">Business Manager Assets</p>
          </div>
        </div>

        {/* Business Manager ID */}
        <div className="mb-3 rounded-xl border border-blue-500/20 bg-[#050a18]/80 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-[#f5f5dc]/60">Business Manager ID</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowBmId(!showBmId)}
                title="Toggle visibility"
                className="rounded p-1 text-[#f5f5dc]/60 hover:bg-blue-500/10 hover:text-blue-400"
              >
                {showBmId ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              {businessManagerId && (
                <button
                  onClick={() => onCopy(businessManagerId, "Business Manager ID")}
                  title="Copy Business Manager ID"
                  className="rounded p-1 text-[#f5f5dc]/60 hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm text-[#f5f5dc]">
              {businessManagerId ? (showBmId ? businessManagerId : "************") : "Not linked"}
            </p>
            {businessManagerId && (
              <div className="rounded-full bg-emerald-500/20 p-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              </div>
            )}
          </div>
          {businessName && (
            <p className="mt-1 text-xs text-blue-400">{businessName}</p>
          )}
        </div>

        {/* Verification Status Bar */}
        <div className={cn("mb-4 rounded-xl border p-3", status.border, status.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={status.text}>{status.icon}</span>
              <span className="text-sm font-medium text-[#f5f5dc]">Verification Status</span>
            </div>
            <span className={cn("text-xs font-bold tracking-wide", status.text)}>
              {status.label.toUpperCase()}
            </span>
          </div>
          {verificationStatus && verificationStatus !== "verified" && (
            <p className="mt-2 text-xs text-[#f5f5dc]/50">
              Complete Meta business verification to unlock full API access.
            </p>
          )}
        </div>

        {/* Linked Assets Grid */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-[#f5f5dc]/60">LINKED ASSETS</span>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl border border-blue-500/20 bg-[#050a18]/60 p-3 text-center">
            <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Globe className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-lg font-bold text-blue-400">
              {getAssetCount(linkedAssets?.facebookPages ?? null)}
            </p>
            <p className="text-[10px] text-[#f5f5dc]/50">FB Pages</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-pink-500/20 bg-[#050a18]/60 p-3 text-center">
            <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
              <Instagram className="h-4 w-4 text-pink-400" />
            </div>
            <p className="text-lg font-bold text-pink-400">
              {getAssetCount(linkedAssets?.instagramAccounts ?? null)}
            </p>
            <p className="text-[10px] text-[#f5f5dc]/50">IG Accounts</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 p-3 text-center">
            <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4af37]/10">
              <Users className="h-4 w-4 text-[#f9d976]" />
            </div>
            <p className="text-lg font-bold text-[#f9d976]">
              {getAssetCount(linkedAssets?.systemUsers ?? null)}
            </p>
            <p className="text-[10px] text-[#f5f5dc]/50">Sys Users</p>
          </div>
        </div>
        {!hasLinkedAssets && (
          <p className="mt-2 text-xs text-[#f5f5dc]/40">No linked assets synced yet.</p>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT RADAR - Real-Time Event Monitoring
   Justifies manage_events permission
   ═══════════════════════════════════════════════════════════════════════════ */

interface EventRadarProps {
  eventStats?: {
    messageSent?: number;
    messageDelivered?: number;
    messageRead?: number;
    linkClicked?: number;
  } | null;
  eventsLast24h?: number | null;
  conversionTrackingEnabled?: boolean;
  onToggleConversionTracking?: () => void;
}

export function EventRadar({
  eventStats,
  eventsLast24h,
  conversionTrackingEnabled = false,
  onToggleConversionTracking,
}: EventRadarProps) {
  const stats = eventStats ?? {};
  const hasStats = Object.values(stats).some((value) => (value ?? 0) > 0);
  const hasEvents = (eventsLast24h ?? 0) > 0;
  const showData = hasStats || hasEvents;
  const statusLabel = showData ? "LIVE" : "NO DATA";
  const statusClass = showData ? "text-[#e11d48]" : "text-[#f5f5dc]/50";
  const getCount = (value?: number) => (showData ? String(value ?? 0) : "--");

  // Simulated pulse points for the radar
  const pulsePoints = [
    { x: 30, y: 20, delay: 0, type: "sent" },
    { x: 70, y: 35, delay: 0.5, type: "delivered" },
    { x: 50, y: 55, delay: 1, type: "read" },
    { x: 25, y: 70, delay: 1.5, type: "clicked" },
    { x: 80, y: 60, delay: 2, type: "sent" },
  ];

  const typeColors = {
    sent: "#d4af37",
    delivered: "#10b981",
    read: "#3b82f6",
    clicked: "#e11d48",
  };

  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-2xl border border-[#e11d48]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#1a0510] p-6"
    >
      {/* Magenta corner glow */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#e11d48]/15 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e11d48]/40 bg-[#e11d48]/10">
              <BarChart3 className="h-5 w-5 text-[#e11d48]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider text-[#e11d48]">EVENT RADAR</h3>
              <p className="text-xs text-[#f5f5dc]/50">Real-Time Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showData ? (
              <motion.div
                className="h-2 w-2 rounded-full bg-[#e11d48]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : (
              <span className="h-2 w-2 rounded-full bg-[#f5f5dc]/30" />
            )}
            <span className={cn("text-xs", statusClass)}>{statusLabel}</span>
          </div>
        </div>

        {/* Pulse Monitor Visual */}
        <div className="mb-4 relative h-28 rounded-xl border border-[#e11d48]/20 bg-[#050a18]/80 overflow-hidden">
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="radarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e11d48" strokeWidth="0.2" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#radarGrid)" />
            {/* Scanning line */}
            <motion.line
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
              stroke="#e11d48"
              strokeWidth="2"
              opacity="0.5"
              animate={{ y1: [0, 112, 0], y2: [0, 112, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </svg>

          {/* Pulse Points */}
          {showData &&
            pulsePoints.map((point, idx) => (
              <motion.div
                key={idx}
                className="absolute"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1],
                  opacity: [0, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: point.delay,
                  repeatDelay: 2,
                }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: typeColors[point.type as keyof typeof typeColors],
                    boxShadow: `0 0 10px ${typeColors[point.type as keyof typeof typeColors]}`,
                  }}
                />
              </motion.div>
            ))}

          {/* Legend */}
          <div className="absolute bottom-2 left-2 flex gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#d4af37]" />
              <span className="text-[#f5f5dc]/50">Sent</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[#f5f5dc]/50">Delivered</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-[#f5f5dc]/50">Read</span>
            </span>
          </div>
        </div>

        {!showData && (
          <div className="mb-4 rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/60 p-3 text-xs text-[#f5f5dc]/50">
            No events yet. Configure your connection and wait for incoming messages.
          </div>
        )}

        {/* Event Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/60 p-2 text-center">
            <Send className="mx-auto mb-1 h-3.5 w-3.5 text-[#d4af37]" />
            <p className="text-sm font-bold text-[#d4af37]">{getCount(stats.messageSent)}</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Sent</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-[#050a18]/60 p-2 text-center">
            <CheckCheck className="mx-auto mb-1 h-3.5 w-3.5 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-400">{getCount(stats.messageDelivered)}</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Delivered</p>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-[#050a18]/60 p-2 text-center">
            <Eye className="mx-auto mb-1 h-3.5 w-3.5 text-blue-400" />
            <p className="text-sm font-bold text-blue-400">{getCount(stats.messageRead)}</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Read</p>
          </div>
          <div className="rounded-lg border border-[#e11d48]/20 bg-[#050a18]/60 p-2 text-center">
            <MousePointerClick className="mx-auto mb-1 h-3.5 w-3.5 text-[#e11d48]" />
            <p className="text-sm font-bold text-[#e11d48]">{getCount(stats.linkClicked)}</p>
            <p className="text-[9px] text-[#f5f5dc]/40">Clicked</p>
          </div>
        </div>

        {/* Conversion Tracking Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-[#e11d48]/20 bg-[#050a18]/60 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#e11d48]" />
            <span className="text-sm text-[#f5f5dc]">Track Conversion Events</span>
          </div>
          <button
            onClick={onToggleConversionTracking}
            disabled={!showData}
            title="Toggle conversion tracking"
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              conversionTrackingEnabled ? "bg-[#e11d48]" : "bg-[#f5f5dc]/20",
              !showData && "cursor-not-allowed opacity-60"
            )}
          >
            <motion.div
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
              animate={{ left: conversionTrackingEnabled ? "calc(100% - 22px)" : "2px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════
   WEBHOOK STATUS CARD - Technical Vault with Ping Test
   ═══════════════════════════════════════════════════════════════════════════ */

interface WebhookStatusCardProps {
  webhookUrl?: string | null;
  isVerified?: boolean;
  onPingTest?: () => Promise<boolean>;
  onCopy: (text: string, label: string) => void;
  pingDisabledReason?: string;
}

export function WebhookStatusCard({
  webhookUrl,
  isVerified = false,
  onPingTest,
  onCopy,
  pingDisabledReason,
}: WebhookStatusCardProps) {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<"success" | "error" | null>(null);

  const handlePing = async () => {
    if (!onPingTest) return;
    setIsPinging(true);
    setPingResult(null);
    try {
      const success = await onPingTest();
      setPingResult(success ? "success" : "error");
    } catch {
      setPingResult("error");
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#0d1a0a] p-6"
    >
      {/* Gold corner accent */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#d4af37]/15 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10">
            <Wifi className="h-5 w-5 text-[#f9d976]" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-[#f9d976]">WEBHOOK GATEWAY</h3>
            <p className="text-xs text-[#f5f5dc]/50">Real-time Event Delivery</p>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="mb-3 rounded-xl border border-[#d4af37]/20 bg-[#050a18]/80 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-[#f5f5dc]/60">Callback URL</span>
            {webhookUrl && (
              <button
                onClick={() => onCopy(webhookUrl, "Webhook URL")}
                title="Copy Webhook URL"
                className="rounded p-1 text-[#f5f5dc]/60 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="truncate font-mono text-xs text-[#f5f5dc]">
            {webhookUrl ?? "Not configured"}
          </p>
        </div>

        {/* Verification & Ping */}
        <div className="flex items-center gap-3">
          {/* Verified Badge */}
          <div
            className={cn(
              "flex flex-1 items-center gap-2 rounded-xl border p-3",
              isVerified
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            )}
          >
            {isVerified ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
            <span className={cn("text-sm", isVerified ? "text-emerald-400" : "text-amber-400")}>
              {isVerified ? "Verified" : "Pending"}
            </span>
          </div>

          {/* Ping Test Button */}
          <motion.button
            onClick={handlePing}
            disabled={isPinging || !webhookUrl || !onPingTest}
            className={cn(
              "relative flex h-11 items-center gap-2 rounded-xl border-2 px-4 text-sm font-semibold transition-all",
              "border-[#d4af37] bg-[#d4af37]/10 text-[#f9d976]",
              "hover:bg-[#d4af37]/20 disabled:opacity-50"
            )}
            whileTap={{ scale: 0.95 }}
          >
            {/* Gold Sonar Effect */}
            {isPinging && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-xl border-2 border-[#d4af37]"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.span
                  className="absolute inset-0 rounded-xl border-2 border-[#d4af37]"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}
            {isPinging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : pingResult === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : pingResult === "error" ? (
              <XCircle className="h-4 w-4 text-red-400" />
            ) : (
              <Radio className="h-4 w-4" />
            )}
            <span className="relative z-10">Ping Test</span>
          </motion.button>
        </div>
        {pingDisabledReason && (
          <p className="mt-3 text-xs text-[#f5f5dc]/50">{pingDisabledReason}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MONITOR CARD - EKG Latency Graph + Uptime
   ═══════════════════════════════════════════════════════════════════════════ */

interface MonitorCardProps {
  latencyMs?: number | null;
  uptime?: number | null;
  eventsLast24h?: number | null;
}

export function MonitorCard({
  latencyMs = null,
  uptime = null,
  eventsLast24h = null,
}: MonitorCardProps) {
  const latencyValue = latencyMs === null ? "--" : `${latencyMs}ms`;
  const latencyValueClass = latencyMs === null ? "text-[#f5f5dc]/60" : "text-emerald-400";
  const uptimeValue = uptime === null ? "--" : `${uptime}%`;
  const uptimeValueClass = uptime === null ? "text-[#f5f5dc]/60" : "text-emerald-400";
  const eventsValue = eventsLast24h === null ? "--" : String(eventsLast24h);

  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#051a1a] p-6"
    >
      {/* Emerald corner glow */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-emerald-400">LIVE MONITOR</h3>
            <p className="text-xs text-[#f5f5dc]/50">Real-Time Metrics</p>
          </div>
        </div>

        {/* EKG Graph */}
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-[#050a18]/80 p-3">
          <p className="mb-2 text-xs text-[#f5f5dc]/60">API Latency</p>
          <svg className="h-12 w-full" viewBox="0 0 200 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ekgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* EKG line */}
            {latencyMs === null ? (
              <path
                d="M0,20 L200,20"
                fill="none"
                stroke="rgba(245, 245, 220, 0.2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <motion.path
                d="M0,20 L20,20 L25,20 L30,5 L35,35 L40,20 L60,20 L80,20 L85,20 L90,8 L95,32 L100,20 L120,20 L140,20 L145,20 L150,5 L155,35 L160,20 L180,20 L200,20"
                fill="none"
                stroke="url(#ekgGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
          </svg>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#f5f5dc]/60">Current</span>
            <span className={`font-mono text-lg font-bold ${latencyValueClass}`}>{latencyValue}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-[#050a18]/80 p-3 text-center">
            <p className={`text-3xl font-bold ${uptimeValueClass}`}>{uptimeValue}</p>
            <p className="text-xs text-[#f5f5dc]/60">Uptime</p>
          </div>
          <div className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/80 p-3 text-center">
            <p className="text-3xl font-bold text-[#f9d976]">{eventsValue}</p>
            <p className="text-xs text-[#f5f5dc]/60">Events 24h</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WEBHOOK TERMINAL CARD - Live Event Logs
   ═══════════════════════════════════════════════════════════════════════════ */

interface WebhookTerminalCardProps {
  recentEvents?: Array<{ type: string; timestamp: string }>;
  workspaceSlug: string;
}

export function WebhookTerminalCard({ recentEvents = [], workspaceSlug }: WebhookTerminalCardProps) {
  // Transform events to logs format - using useMemo instead of useState+useEffect
  const logs = recentEvents.slice(0, 6).map((e) => ({
    type: e.type,
    time: new Date(e.timestamp).toLocaleTimeString(),
  }));

  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-2xl border border-[#e11d48]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#1a0a14] p-6"
    >
      {/* Magenta corner glow */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#e11d48]/10 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e11d48]/40 bg-[#e11d48]/10">
              <Terminal className="h-5 w-5 text-[#e11d48]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider text-[#e11d48]">WEBHOOK STREAM</h3>
              <p className="text-xs text-[#f5f5dc]/50">Live Event Log</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-2 w-2 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-emerald-400">LIVE</span>
          </div>
        </div>

        {/* Terminal window */}
        <div className="rounded-xl border border-[#e11d48]/20 bg-[#050a18] font-mono text-xs">
          {/* Terminal header */}
          <div className="flex items-center gap-2 border-b border-[#e11d48]/20 px-3 py-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="ml-2 text-[#f5f5dc]/40">webhook-events.log</span>
          </div>

          {/* Log entries */}
          <div className="max-h-40 overflow-y-auto p-3">
            <AnimatePresence>
              {logs.map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-2 py-1"
                >
                  <span className="text-[#f5f5dc]/40">[{log.time}]</span>
                  <span className="text-emerald-400">{">>"}</span>
                  <span className="text-[#f9d976]">{log.type}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {logs.length === 0 && (
              <p className="py-4 text-center text-[#f5f5dc]/40">No events yet...</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Link href={`/${workspaceSlug}/meta-hub/webhooks`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-[#e11d48]/40 text-[#e11d48] hover:bg-[#e11d48]/10"
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM EMBEDDED SIGNUP - The Gateway
   ═══════════════════════════════════════════════════════════════════════════ */

interface ImperiumEmbeddedSignupProps {
  workspaceSlug: string;
  canEdit: boolean;
  isConnected: boolean;
  onSuccess?: () => void;
}

const SDK_URL = "https://connect.facebook.net/en_US/sdk.js";
const DEFAULT_GRAPH_VERSION = "v22.0";

declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        params: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type SignupStatus = "idle" | "authorizing" | "waiting" | "saving" | "done" | "error";

export function ImperiumEmbeddedSignup({
  workspaceSlug,
  canEdit,
  isConnected,
  onSuccess,
}: ImperiumEmbeddedSignupProps) {
  const { toast } = useToast();
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID ?? "";
  const solutionId = process.env.NEXT_PUBLIC_META_SOLUTION_ID ?? "";

  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<SignupStatus>("idle");
  const [label, setLabel] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const pendingFinishRef = useRef<{
    wabaId: string;
    phoneNumberId: string;
    businessId?: string | null;
  } | null>(null);

  const isConfigured = Boolean(appId && configId);

  // Initialize Facebook SDK
  useEffect(() => {
    if (!appId) return;
    if (typeof window === "undefined") return;

    window.fbAsyncInit = () => {
      if (!window.FB) return;
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: DEFAULT_GRAPH_VERSION,
      });
      setSdkReady(true);
    };

    if (window.FB) {
      window.fbAsyncInit?.();
    }
  }, [appId]);

  const saveConnection = useCallback(
    async (
      code: string,
      payload: { wabaId: string; phoneNumberId: string; businessId?: string | null }
    ) => {
      setStatus("saving");
      try {
        const res = await fetch("/api/meta/whatsapp/connections/embedded-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceSlug,
            label: label.trim() || null,
            waba_id: payload.wabaId,
            phone_number_id: payload.phoneNumberId,
            businessId: payload.businessId ?? null,
            code,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.message || data?.reason || "Failed to save connection.");
        }
        setStatus("done");
        setShowSuccess(true);
        toast({ title: "Neural Connection Established!", description: "WhatsApp connected successfully." });
        setTimeout(() => {
          setShowSuccess(false);
          router.refresh();
          onSuccess?.();
        }, 3000);
      } catch (err) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Failed to save connection.";
        toast({ title: "Connection failed", description: msg, variant: "destructive" });
      }
    },
    [label, router, toast, workspaceSlug, onSuccess]
  );

  // Listen for postMessage from Meta Embedded Signup
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const origin = (event.origin || "").toLowerCase();
      if (!origin.includes("facebook.com")) return;

      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      const data = payload as {
        type?: string;
        event?: string;
        data?: Record<string, unknown>;
      } | null;
      if (!data || data.type !== "WA_EMBEDDED_SIGNUP") return;

      const eventType = data.event ?? (data.data?.event as string | undefined);
      const info = (data.data ?? data) as Record<string, unknown>;

      if (eventType === "FINISH") {
        const wabaId = String(info.waba_id ?? info.wabaId ?? "");
        const phoneNumberId = String(info.phone_number_id ?? info.phoneNumberId ?? "");
        const businessId = info.business_id ?? info.businessId ?? null;
        if (!wabaId || !phoneNumberId) {
          setStatus("error");
          return;
        }
        const finishPayload = {
          wabaId,
          phoneNumberId,
          businessId: businessId ? String(businessId) : null,
        };
        if (authCode) {
          void saveConnection(authCode, finishPayload);
        } else {
          pendingFinishRef.current = finishPayload;
          setStatus("waiting");
        }
      } else if (eventType === "CANCEL" || eventType === "ERROR") {
        setStatus("idle");
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [authCode, saveConnection]);

  function launchSignup() {
    if (!window.FB || !sdkReady) {
      toast({
        title: "SDK not ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setStatus("authorizing");

    const extras: Record<string, unknown> = { sessionInfoVersion: "3" };
    if (solutionId) {
      extras.setup = { solutionID: solutionId };
    }

    window.FB.login(
      (response) => {
        const code = response?.authResponse?.code ?? null;
        if (!code) {
          setStatus("error");
          return;
        }
        setAuthCode(code);
        setStatus("waiting");
        if (pendingFinishRef.current) {
          void saveConnection(code, pendingFinishRef.current);
          pendingFinishRef.current = null;
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras,
      }
    );
  }

  if (!mounted) {
    return <div className="h-48 animate-pulse rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80" />;
  }

  // Already connected - show success state
  if (isConnected) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-900/20 via-[#0a1229] to-[#050a18] p-8 text-center"
      >
        <div className="relative z-10">
          <motion.div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/60 bg-emerald-500/20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </motion.div>
          <h3 className="text-xl font-bold text-emerald-400">Connection Active</h3>
          <p className="mt-2 text-sm text-[#f5f5dc]/60">
            Your WhatsApp Business API is connected and operational.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Script src={SDK_URL} strategy="afterInteractive" />

      {/* Success Particle Effect */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a18]/90"
          >
            {/* Particle burst effect */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-3 w-3 rounded-full"
                style={{
                  background: i % 2 === 0 ? "#d4af37" : "#10b981",
                  left: "50%",
                  top: "50%",
                }}
                initial={{ x: 0, y: 0, scale: 0 }}
                animate={{
                  x: Math.cos((i * 360) / 20 * (Math.PI / 180)) * 200,
                  y: Math.sin((i * 360) / 20 * (Math.PI / 180)) * 200,
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-center"
            >
              <Sparkles className="mx-auto mb-4 h-16 w-16 text-[#f9d976]" />
              <h2 className="text-3xl font-bold text-[#f9d976]">Neural Connection Established!</h2>
              <p className="mt-2 text-[#f5f5dc]/70">WhatsApp Business API is now linked</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-3xl border-2 border-[#d4af37]/60 bg-gradient-to-br from-[#d4af37]/10 via-[#0a1229] to-[#050a18] p-10 shadow-[0_0_60px_rgba(212,175,55,0.15)]"
      >
        {/* Imperium Gold Glow - Enhanced */}
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-[#d4af37]/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-[#d4af37]/15 blur-3xl" />
        
        {/* Cyber-Batik Overlay */}
        <div className="pointer-events-none absolute inset-0 batik-pattern opacity-[0.03]" />

        <div className="relative z-10">
          {/* Meta Logo Container with Glow */}
          <div className="mb-8 flex flex-col items-center text-center">
            <motion.div 
              className="relative mb-6"
              animate={{ boxShadow: ["0 0 40px rgba(212,175,55,0.3)", "0 0 60px rgba(212,175,55,0.5)", "0 0 40px rgba(212,175,55,0.3)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* Outer Glow Ring */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#d4af37]/30 via-[#f9d976]/20 to-[#d4af37]/30 blur-xl" />
              
              {/* Meta Logo Container */}
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[#d4af37] bg-gradient-to-br from-[#d4af37]/20 to-[#050a18] shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                <svg className="h-12 w-12 text-[#f9d976]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
            </motion.div>

            <h3 className="text-2xl font-bold text-[#f9d976]">Connect with Facebook</h3>
            <p className="mt-3 max-w-lg text-sm text-[#f5f5dc]/60">
              Establish a secure neural link with Meta&apos;s WhatsApp Business Platform using the Official Embedded Signup.
            </p>

            {/* Official Meta Technology Provider Seal */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2">
                <BadgeCheck className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">Official Meta Technology Provider</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">256-bit Secure Encryption</span>
              </div>
            </div>
          </div>

          {!isConfigured ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center text-sm text-amber-200">
              <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
              Configuration required. Set NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_CONFIG_ID.
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Label htmlFor="connectionLabel" className="text-sm text-[#f5f5dc]/70">
                  Connection Label (optional)
                </Label>
                <Input
                  id="connectionLabel"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., WA Support / WA Sales"
                  disabled={!canEdit || status === "saving"}
                  className="mt-2 border-[#d4af37]/30 bg-[#050a18]/80 text-[#f5f5dc] placeholder:text-[#f5f5dc]/40 focus:ring-2 focus:ring-[#d4af37]/50"
                />
              </div>

              {/* MASSIVE Primary CTA Button */}
              <motion.button
                onClick={launchSignup}
                disabled={!canEdit || !sdkReady || status === "saving"}
                className={cn(
                  "group relative w-full overflow-hidden rounded-2xl border-2 border-[#d4af37] bg-gradient-to-r from-[#d4af37]/20 via-[#f9d976]/25 to-[#d4af37]/20 px-10 py-6 text-xl font-bold text-[#f9d976] transition-all",
                  "hover:from-[#d4af37]/30 hover:via-[#f9d976]/40 hover:to-[#d4af37]/30 hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Traveling gold shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f9d976]/40 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                {/* Outer pulse ring */}
                <motion.div
                  className="absolute -inset-1 rounded-2xl border-2 border-[#d4af37]/50"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="relative z-10 flex items-center justify-center gap-4">
                  {status === "saving" ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin" />
                      Establishing Neural Link...
                    </>
                  ) : (
                    <>
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Launch Embedded Signup
                    </>
                  )}
                </span>
              </motion.button>

              {/* Compliance Shields Row */}
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/50">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span>Data handled via Meta&apos;s Official SDK</span>
                </div>
                <span className="hidden text-[#f5f5dc]/30 sm:inline">•</span>
                <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/50">
                  <Lock className="h-4 w-4 text-blue-400" />
                  <span>We never store your Facebook credentials</span>
                </div>
              </div>

              {!canEdit && (
                <p className="mt-4 text-center text-xs text-amber-400">
                  Only owners or admins can add new connections.
                </p>
              )}
            </>
          )}

          {/* SDK Status */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                sdkReady ? "bg-emerald-400" : "bg-amber-400"
              )}
            />
            <span className={sdkReady ? "text-emerald-400" : "text-amber-400"}>
              {sdkReady ? "Meta SDK Ready" : "Loading SDK..."}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEALTH CHECK SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

interface HealthCheckProps {
  workspaceId: string;
  workspaceSlug: string;
}

type CheckResult = {
  ok: boolean;
  reason?: string;
  events24h?: number;
  count?: number;
};

type VerifyResponse = {
  ok: boolean;
  checks: {
    token: CheckResult;
    connection: CheckResult;
    templates: CheckResult;
    webhooks: CheckResult;
  };
  recommendations: string[];
};

export function ImperiumHealthCheck({ workspaceId, workspaceSlug }: HealthCheckProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const handleVerify = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meta/whatsapp/verify?workspaceId=${workspaceId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        toast({ title: "All systems operational!", description: "Health check passed." });
      } else {
        toast({
          title: "Issues detected",
          description: "Review the health panel for details.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  const checks = result?.checks;
  const checkItems = [
    { key: "token", label: "Access Token", icon: Lock },
    { key: "connection", label: "Phone Connection", icon: Radio },
    { key: "templates", label: "Templates Synced", icon: Activity },
    { key: "webhooks", label: "Webhook Events", icon: Terminal },
  ] as const;

  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18] p-6"
    >
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10">
              <Zap className="h-5 w-5 text-[#f9d976]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider text-[#f9d976]">SYSTEM DIAGNOSTICS</h3>
              <p className="text-xs text-[#f5f5dc]/50">Run health verification</p>
            </div>
          </div>
          <Button
            onClick={handleVerify}
            disabled={loading}
            size="sm"
            className="gap-2 border-[#d4af37]/40 bg-[#d4af37]/10 text-[#f9d976] hover:bg-[#d4af37]/20"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Verify Now
          </Button>
        </div>

        {/* Check Results */}
        <div className="grid gap-2 sm:grid-cols-2">
          {checkItems.map(({ key, label, icon: Icon }) => {
            const check = checks?.[key];
            const isOk = check?.ok ?? false;
            const isPending = !result;

            return (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3",
                  isPending
                    ? "border-[#d4af37]/20 bg-[#050a18]/60"
                    : isOk
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-red-500/30 bg-red-500/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    isPending
                      ? "bg-[#d4af37]/10"
                      : isOk
                        ? "bg-emerald-500/20"
                        : "bg-red-500/20"
                  )}
                >
                  {loading && !result ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#f5f5dc]/50" />
                  ) : isPending ? (
                    <Icon className="h-4 w-4 text-[#f5f5dc]/50" />
                  ) : isOk ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#f5f5dc]">{label}</p>
                  {check?.reason && !isOk && (
                    <p className="text-xs text-red-400">{check.reason}</p>
                  )}
                  {key === "webhooks" && check?.events24h !== undefined && (
                    <p className="text-xs text-[#f5f5dc]/50">{check.events24h} events in 24h</p>
                  )}
                  {key === "templates" && check?.count !== undefined && (
                    <p className="text-xs text-[#f5f5dc]/50">{check.count} templates synced</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {result && result.recommendations.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-amber-400">Recommendations</p>
                <ul className="mt-1 space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-amber-300/80">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/${workspaceSlug}/meta-hub/webhooks`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#d4af37]/30 text-[#f5f5dc]/70 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Webhooks
            </Button>
          </Link>
          <Link href={`/${workspaceSlug}/meta-hub/messaging/whatsapp`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#d4af37]/30 text-[#f5f5dc]/70 hover:bg-[#d4af37]/10 hover:text-[#f9d976]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Sync Templates
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM FOOTER - Infrastructure Security Tag
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumConnectionsFooter() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-8 border-t border-[#d4af37]/20 pt-6"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Main Tag */}
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4af37]/40" />
          <div className="flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 px-4 py-2">
            <Shield className="h-4 w-4 text-[#d4af37]" />
            <span className="text-xs font-semibold tracking-wide text-[#d4af37]">
              Infrastructure Security by PT Glorious Victorious
            </span>
          </div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4af37]/40" />
        </div>

        {/* Meta Verified Badge */}
        <div className="flex items-center gap-4 text-[10px] text-[#f5f5dc]/40">
          <span className="flex items-center gap-1">
            <BadgeCheck className="h-3 w-3 text-blue-400" />
            Verified by Meta
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-400" />
            SOC 2 Type II Compliant
          </span>
          <span>•</span>
          <span>Enterprise-Grade Security</span>
        </div>
      </div>
    </motion.div>
  );
}
