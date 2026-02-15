"use client";

import { motion } from "framer-motion";
import {
  Building2,
  MessageSquare,
  Bot,
  Palette,
  LayoutGrid,
  Store,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

type Pillar = {
  id: string;
  name: string;
  icon: LucideIcon;
  active: boolean;
};

const PILLARS: Pillar[] = [
  { id: "platform", name: "Platform", icon: Building2, active: true },
  { id: "meta-hub", name: "Meta Hub", icon: MessageSquare, active: true },
  { id: "helper", name: "Helper", icon: Bot, active: true },
  { id: "studio", name: "Studio", icon: Palette, active: true },
  { id: "apps", name: "Apps", icon: LayoutGrid, active: true },
  { id: "marketplace", name: "Marketplace", icon: Store, active: true },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export function PillarGrid() {
  const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);

  return (
    <div className="mt-8 space-y-4">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-[#f5f5dc]/50">
        The 7-Product Ecosystem
      </p>
      <motion.div
        className="grid grid-cols-3 gap-3 sm:grid-cols-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          const isHovered = hoveredPillar === pillar.id;

          return (
            <motion.div
              key={pillar.id}
              variants={itemVariants}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredPillar(pillar.id)}
              onMouseLeave={() => setHoveredPillar(null)}
            >
              {/* Icon container */}
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 ${
                  pillar.active
                    ? "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] hover:border-[#d4af37]/60 hover:bg-[#d4af37]/20 hover:shadow-lg hover:shadow-[#d4af37]/20"
                    : "border-white/10 bg-white/5 text-white/30"
                }`}
              >
                <Icon className="h-5 w-5" />
                
                {/* Lock overlay for future pillars */}
                {!pillar.active && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#e11d48] text-white">
                    <Lock className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>

              {/* Tooltip */}
              <div
                className={`absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-200 ${
                  isHovered
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-1 pointer-events-none"
                } ${
                  pillar.active
                    ? "bg-[#d4af37] text-[#050a18]"
                    : "bg-[#e11d48] text-white"
                }`}
              >
                {pillar.active ? pillar.name : `${pillar.name} — Coming Soon`}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
