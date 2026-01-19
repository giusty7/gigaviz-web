"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

// Hydration-safe mounted check
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
import { 
  Layers, 
  MessageSquare, 
  Brain, 
  Palette, 
  AppWindow, 
  Store, 
  Gamepad2, 
  Wallet, 
  Users, 
  TrendingUp 
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type ModuleStatus = "available" | "locked" | "coming_soon" | "setup_required";

export type ModuleItem = {
  key: string;
  name: string;
  description: string;
  status: ModuleStatus;
  href?: string;
  accessLabel?: string;
  previewHref?: string;
  previewLabel?: string;
  notifyLabel?: string;
  comingSoonLabel?: string;
  planId?: string | null;
};

type ImperiumModuleGridProps = {
  modules: ModuleItem[];
  onUnlock?: (module: ModuleItem) => void;
  onSetup?: (module: ModuleItem) => void;
  onNotify?: (module: ModuleItem) => void;
};

/* ═══════════════════════════════════════════════════════════════════════════
   PILLAR ICONS MAPPING
   ═══════════════════════════════════════════════════════════════════════════ */

const PILLAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  platform: Layers,
  "meta-hub": MessageSquare,
  helper: Brain,
  studio: Palette,
  apps: AppWindow,
  marketplace: Store,
  arena: Gamepad2,
  pay: Wallet,
  community: Users,
  trade: TrendingUp,
};

/* ═══════════════════════════════════════════════════════════════════════════
   SPARKLINE COMPONENT (Decorative)
   ═══════════════════════════════════════════════════════════════════════════ */

function UsageSparkline() {
  return (
    <svg
      className="h-4 w-full opacity-60"
      viewBox="0 0 100 16"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="100%" y2="0">
          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#e11d48" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M0 12 Q10 8, 15 10 T30 6 T45 9 T60 4 T75 7 T90 5 T100 8"
        fill="none"
        stroke="url(#sparkline-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PULSING STATUS DOT
   ═══════════════════════════════════════════════════════════════════════════ */

function LiveStatusDot() {
  return (
    <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FUTURE PILLAR BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

function FuturePillarBadge() {
  return (
    <span className="absolute right-3 top-3 rounded-full bg-[#d4af37]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#d4af37]">
      Future Pillar
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 24,
    scale: 0.96,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
    },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ImperiumModuleGrid({ 
  modules, 
  onUnlock, 
  onSetup, 
  onNotify 
}: ImperiumModuleGridProps) {
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const handleUnavailable = useCallback(
    (status: ModuleStatus, module: ModuleItem) => {
      if (status === "locked" && onUnlock) {
        onUnlock(module);
        return;
      }

      if (status === "setup_required" && onSetup) {
        onSetup(module);
        return;
      }

      if (status === "coming_soon") {
        toast({
          title: "Coming soon",
          description: "This module is being prepared. Track updates from the roadmap.",
        });
        return;
      }

      if (status === "locked") {
        toast({
          title: "Locked",
          description: "Upgrade or request access to unlock this module.",
        });
        return;
      }

      toast({
        title: "Setup required",
        description: "Complete the configuration before opening this module.",
      });
    },
    [onSetup, onUnlock]
  );

  const isActivePillar = (status: ModuleStatus) => 
    status === "available" || status === "locked" || status === "setup_required";

  const isFuturePillar = (status: ModuleStatus) => status === "coming_soon";

  // SSR placeholder
  if (!mounted) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <div
            key={module.key}
            className="relative h-[180px] animate-pulse rounded-2xl bg-[#0a1229]/60"
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {modules.map((module) => {
        const Icon = PILLAR_ICONS[module.key] || Layers;
        const isActive = isActivePillar(module.status);
        const isFuture = isFuturePillar(module.status);

        return (
          <motion.div
            key={module.key}
            variants={cardVariants}
            className={`
              group relative overflow-hidden rounded-2xl 
              border border-[#d4af37]/20 
              bg-[#0a1229]/60 backdrop-blur-2xl
              p-5 
              transition-all duration-300 ease-out
              hover:scale-[1.03] 
              hover:border-[#d4af37]/40
              hover:shadow-[0_0_24px_rgba(212,175,55,0.15),0_0_48px_rgba(225,29,72,0.08)]
              focus-within:ring-2 focus-within:ring-[#d4af37]/60 focus-within:ring-offset-2 focus-within:ring-offset-[#050a18]
              ${isFuture ? "grayscale-[40%]" : ""}
            `}
            onClick={() => {
              if (module.status === "coming_soon" && module.previewHref) {
                router.push(module.previewHref);
              }
            }}
            role={module.status === "coming_soon" && module.previewHref ? "button" : undefined}
            tabIndex={module.status === "coming_soon" && module.previewHref ? 0 : -1}
          >
            {/* Gradient Border Glow (on hover) */}
            <div 
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(225,29,72,0.1) 50%, rgba(212,175,55,0.08) 100%)",
              }}
              aria-hidden
            />

            {/* Frosted Glass Overlay for Future Pillars */}
            {isFuture && (
              <div 
                className="pointer-events-none absolute inset-0 rounded-2xl bg-[#050a18]/30 backdrop-blur-[2px]" 
                aria-hidden 
              />
            )}

            {/* Status Indicators */}
            {isActive && module.status === "available" && <LiveStatusDot />}
            {isFuture && <FuturePillarBadge />}

            {/* Card Content */}
            <div className="relative z-10">
              {/* Icon + Title */}
              <div className="flex items-start gap-4">
                <div className={`
                  flex h-12 w-12 shrink-0 items-center justify-center rounded-xl 
                  bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10
                  ${isFuture ? "grayscale" : ""}
                `}>
                  <Icon className={`h-6 w-6 ${isFuture ? "text-[#f5f5dc]/40" : "text-[#d4af37]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
                    {module.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#f5f5dc]/60 line-clamp-2">
                    {module.description}
                  </p>
                  {module.accessLabel && (
                    <p className="mt-1 text-xs text-[#f5f5dc]/50">
                      {module.accessLabel}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-3">
                {module.status === "available" && module.href ? (
                  <Link
                    href={module.href}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-4 py-2 text-xs font-semibold text-[#050a18] shadow-lg shadow-[#d4af37]/20 transition-all hover:shadow-[#d4af37]/30 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70"
                  >
                    Open Module
                  </Link>
                ) : module.status === "coming_soon" ? (
                  <div className="inline-flex items-center gap-3">
                    {module.previewHref ? (
                      <Link
                        href={module.previewHref}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-xs font-semibold text-[#d4af37] transition-all hover:bg-[#d4af37]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70"
                      >
                        {module.previewLabel ?? "Preview"}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center rounded-xl border border-[#f5f5dc]/10 bg-[#f5f5dc]/5 px-4 py-2 text-xs font-medium text-[#f5f5dc]/40">
                        {module.comingSoonLabel ?? "Coming soon"}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNotify?.(module);
                      }}
                      className="text-xs font-semibold text-[#e11d48] hover:text-[#d4af37] hover:underline transition-colors"
                    >
                      {module.notifyLabel ?? "Notify me"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUnavailable(module.status, module)}
                    className="inline-flex items-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-xs font-semibold text-[#d4af37] transition-all hover:bg-[#d4af37]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70"
                  >
                    {module.status === "setup_required" ? "Complete setup" : "Unlock features"}
                  </button>
                )}
              </div>

              {/* Usage Sparkline for Active Pillars */}
              {isActive && module.status === "available" && (
                <div className="mt-4 pt-3 border-t border-[#f5f5dc]/5">
                  <UsageSparkline />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
