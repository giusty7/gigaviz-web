"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

type PillarStatus = "live" | "upcoming";

type Pillar = {
  key: string;
  name: string;
  icon: LucideIcon;
  status: PillarStatus;
  href?: string;
};

const pillars: Pillar[] = [
  { key: "platform", name: "Platform", icon: Building2, status: "live", href: "/platform" },
  { key: "meta_hub", name: "Meta Hub", icon: MessageSquare, status: "live", href: "/meta-hub" },
  { key: "helper", name: "Helper", icon: Bot, status: "live", href: "/helper" },
  { key: "studio", name: "Studio", icon: Palette, status: "upcoming" },
  { key: "apps", name: "Apps", icon: LayoutGrid, status: "upcoming" },
  { key: "marketplace", name: "Marketplace", icon: Store, status: "upcoming" },
  { key: "arena", name: "Arena", icon: Trophy, status: "upcoming" },
  { key: "pay", name: "Pay", icon: CreditCard, status: "upcoming" },
  { key: "community", name: "Community", icon: Users, status: "upcoming" },
  { key: "trade", name: "Trade", icon: TrendingUp, status: "upcoming" },
];

type QuickLaunchGridProps = {
  workspaceSlug: string;
};

export function QuickLaunchGrid({ workspaceSlug }: QuickLaunchGridProps) {
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
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            const isLive = pillar.status === "live";
            const href = isLive && pillar.href ? `/${workspaceSlug}${pillar.href}` : undefined;
            
            const content = (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.04 }}
                whileHover={isLive ? { scale: 1.08 } : undefined}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                  isLive
                    ? "border-[#d4af37]/20 bg-[#050a18]/60 cursor-pointer hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_-4px_rgba(212,175,55,0.4)]"
                    : "border-[#f5f5dc]/5 bg-[#050a18]/30 cursor-not-allowed opacity-60"
                }`}
              >
                {/* Status badge */}
                <div className="absolute -right-1 -top-1">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider ${
                      isLive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
                    }`}
                  >
                    {isLive ? "LIVE" : "SOON"}
                  </span>
                </div>
                
                <Icon
                  className={`h-5 w-5 ${
                    isLive ? "text-[#d4af37]" : "text-[#f5f5dc]/30"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    isLive ? "text-[#f5f5dc]" : "text-[#f5f5dc]/40"
                  }`}
                >
                  {pillar.name}
                </span>
              </motion.div>
            );

            if (href) {
              return (
                <Link key={pillar.key} href={href}>
                  {content}
                </Link>
              );
            }

            return <div key={pillar.key}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
