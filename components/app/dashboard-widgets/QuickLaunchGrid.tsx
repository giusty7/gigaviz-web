"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Building2,
  MessageSquare,
  Bot,
  Palette,
  LayoutGrid,
  Store,
  Trophy,
  CreditCard,
  Users,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { ModuleIcon } from "@/lib/modules/catalog";
import type { ModuleRegistryItem } from "@/lib/modules/registry";

const iconMap: Record<ModuleIcon, LucideIcon> = {
  platform: Building2,
  meta: MessageSquare,
  helper: Bot,
  office: LayoutGrid,
  studio: Palette,
  marketplace: Store,
  arena: Trophy,
  apps: LayoutGrid,
  pay: CreditCard,
  community: Users,
};

const keyIconOverrides: Record<string, LucideIcon> = {
  trade: TrendingUp,
};

type QuickLaunchGridProps = {
  workspaceSlug: string;
  workspaceId: string;
  modules: ModuleRegistryItem[];
};

export function QuickLaunchGrid({ workspaceSlug, workspaceId, modules }: QuickLaunchGridProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [notifyingKey, setNotifyingKey] = useState<string | null>(null);

  const handleUnlock = useCallback(
    (module: ModuleRegistryItem) => {
      const target = `/${workspaceSlug}/billing?upgrade=${encodeURIComponent(module.slug)}`;
      router.push(target);
    },
    [router, workspaceSlug]
  );

  const handleNotify = useCallback(
    async (module: ModuleRegistryItem) => {
      if (!module.slug || notifyingKey) return;
      setNotifyingKey(module.slug);
      try {
        const res = await fetch("/api/feature-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            moduleSlug: module.slug,
            notes: null,
          }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const error = payload?.reason || payload?.error || "request_failed";
          toast({ title: "Request failed", description: String(error) });
          return;
        }

        toast({ title: "Saved", description: "We will notify you when this module is ready." });
      } catch {
        toast({ title: "Request failed", description: "network_error" });
      } finally {
        setNotifyingKey(null);
      }
    },
    [notifyingKey, toast, workspaceId]
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl">
      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at center top, rgba(212, 175, 55, 0.05) 0%, transparent 50%)",
        }}
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#f5f5dc]">Quick Launch</h3>
          <span className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">10 Pillars</span>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {modules.map((module, index) => {
            const Icon = keyIconOverrides[module.key] ?? iconMap[module.icon] ?? LayoutGrid;
            const isAvailable = module.status === "available";
            const isLocked = module.status === "locked";
            const isComingSoon = module.status === "coming_soon";
            const href = isAvailable && module.href ? module.href : undefined;
            
            const content = (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
                whileHover={isAvailable ? { scale: 1.08 } : undefined}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                  isAvailable
                    ? "border-[#d4af37]/20 bg-[#050a18]/60 cursor-pointer hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_-4px_rgba(212,175,55,0.4)]"
                    : "border-[#f5f5dc]/5 bg-[#050a18]/30 opacity-60"
                }`}
                title={
                  isLocked
                    ? "Upgrade to unlock"
                    : isComingSoon
                      ? "Coming soon"
                      : undefined
                }
              >
                {/* Status badge */}
                <div className="absolute -right-1 -top-1">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider ${
                      isAvailable
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isLocked
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
                    }`}
                  >
                    {isAvailable ? "LIVE" : isLocked ? "LOCKED" : "SOON"}
                  </span>
                </div>
                
                <Icon
                  className={`h-5 w-5 ${
                    isAvailable ? "text-[#d4af37]" : "text-[#f5f5dc]/30"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isAvailable ? "text-[#f5f5dc]" : "text-[#f5f5dc]/40"
                  }`}
                >
                  {module.name}
                </span>

                {isLocked && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleUnlock(module);
                    }}
                    className="text-[9px] font-semibold text-[#d4af37] hover:underline"
                  >
                    Unlock
                  </button>
                )}
                {isComingSoon && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      void handleNotify(module);
                    }}
                    disabled={notifyingKey === module.slug}
                    className="text-[9px] font-semibold text-[#d4af37] hover:underline disabled:opacity-50"
                  >
                    {notifyingKey === module.slug ? "Saving..." : "Notify me"}
                  </button>
                )}
              </motion.div>
            );

            if (href) {
              return (
                <Link key={module.key} href={href}>
                  {content}
                </Link>
              );
            }

            return <div key={module.key}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
