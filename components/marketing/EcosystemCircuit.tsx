"use client";

import { useState } from "react";
import Link from "next/link";

type NodePillar = "core" | "connect" | "create" | "commerce";

interface CircuitNode {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  pillar: NodePillar;
  gridX: number; // 0-6 columns
  gridY: number; // 0-4 rows
}

// Circuit Board Grid Layout (7 columns x 5 rows) — 7 products
// Core at center, modules arranged in circuit pattern
const nodes: CircuitNode[] = [
  // CORE - Center (col 3, row 2)
  { id: "core", title: "GIGAVIZ", subtitle: "Platform Core", href: "/products/platform", pillar: "core", gridX: 3, gridY: 2 },

  // COMMERCE - Top row (cream)
  { id: "marketplace", title: "MARKETPLACE", subtitle: "Digital Products", href: "/products/marketplace", pillar: "commerce", gridX: 2, gridY: 0 },
  { id: "apps", title: "APPS", subtitle: "Integrations", href: "/products/apps", pillar: "commerce", gridX: 4, gridY: 0 },

  // CREATE - Left side (magenta)
  { id: "helper", title: "HELPER", subtitle: "AI Assistant", href: "/products/helper", pillar: "create", gridX: 0, gridY: 2 },
  { id: "studio", title: "STUDIO", subtitle: "Creative Suite", href: "/products/studio", pillar: "create", gridX: 0, gridY: 4 },
  { id: "office", title: "OFFICE", subtitle: "AI Documents", href: "/products/office", pillar: "create", gridX: 2, gridY: 4 },

  // CONNECT - Right side (gold)
  { id: "meta_hub", title: "META HUB", subtitle: "WhatsApp API", href: "/products/meta-hub", pillar: "connect", gridX: 6, gridY: 2 },
];

// Circuit traces - 90° angle paths connecting nodes
const circuitTraces = [
  // Core connections (gold, thick)
  { from: "core", to: "marketplace", pillar: "core" as NodePillar, path: "M 50 40 L 50 15 L 35.7 15" },
  { from: "core", to: "apps", pillar: "core" as NodePillar, path: "M 50 40 L 50 15 L 64.3 15" },
  { from: "core", to: "helper", pillar: "core" as NodePillar, path: "M 42 50 L 20 50 L 20 40" },
  { from: "core", to: "meta_hub", pillar: "core" as NodePillar, path: "M 58 50 L 80 50 L 80 40" },

  // Commerce traces (cream) - horizontal bus at top
  { from: "marketplace", to: "apps", pillar: "commerce" as NodePillar, path: "M 42.9 15 L 57.1 15" },

  // Create traces (magenta) - left side
  { from: "helper", to: "studio", pillar: "create" as NodePillar, path: "M 7.1 60 L 7.1 78" },
  { from: "studio", to: "office", pillar: "create" as NodePillar, path: "M 14.3 85 L 28.6 85" },
  { from: "office", to: "core", pillar: "create" as NodePillar, path: "M 35.7 78 L 35.7 60 L 42 60" },

  // Connect traces (gold) - right side
  { from: "meta_hub", to: "core", pillar: "connect" as NodePillar, path: "M 85.7 60 L 85.7 50 L 58 50" },
];

function getPillarStyles(pillar: NodePillar) {
  switch (pillar) {
    case "connect":
      return {
        border: "border-gigaviz-gold/50",
        bg: "bg-gradient-to-br from-gigaviz-gold/20 to-gigaviz-gold/5",
        text: "text-gigaviz-gold",
        glow: "shadow-[0_0_20px_-4px_var(--gv-gold),0_0_40px_-8px_var(--gv-gold)]",
        trace: "var(--gv-gold)",
      };
    case "create":
      return {
        border: "border-gigaviz-magenta/50",
        bg: "bg-gradient-to-br from-gigaviz-magenta/20 to-gigaviz-magenta/5",
        text: "text-gigaviz-magenta",
        glow: "shadow-[0_0_20px_-4px_var(--gv-magenta),0_0_40px_-8px_var(--gv-magenta)]",
        trace: "var(--gv-magenta)",
      };
    case "commerce":
      return {
        border: "border-gigaviz-cream/40",
        bg: "bg-gradient-to-br from-gigaviz-cream/15 to-gigaviz-cream/5",
        text: "text-gigaviz-cream",
        glow: "shadow-[0_0_16px_-4px_var(--gv-cream)]",
        trace: "var(--gv-cream)",
      };
    case "core":
      return {
        border: "border-gigaviz-gold/60",
        bg: "bg-gradient-to-br from-gigaviz-gold/25 to-gigaviz-navy-light",
        text: "text-gigaviz-gold",
        glow: "shadow-[0_0_32px_-4px_var(--gv-gold),0_0_64px_-8px_var(--gv-gold)]",
        trace: "var(--gv-gold)",
      };
  }
}

export function EcosystemCircuit() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Calculate pixel position from grid coordinates
  const getPosition = (gridX: number, gridY: number) => ({
    left: `${7.14 + gridX * 14.28}%`, // 7 columns, ~14.28% each
    top: `${15 + gridY * 17.5}%`,     // 5 rows, ~17.5% each
  });

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[600px] items-center justify-center lg:max-w-[680px]">
      <div className="relative w-full" style={{ aspectRatio: "4 / 3" }}>
        
        {/* Background grid pattern (subtle PCB effect) */}
        <div 
          aria-hidden 
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--gv-gold) 1px, transparent 1px),
              linear-gradient(to bottom, var(--gv-gold) 1px, transparent 1px)
            `,
            backgroundSize: "14.28% 17.5%",
          }}
        />

        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-10%] rounded-3xl bg-gradient-to-br from-gigaviz-gold/8 via-transparent to-gigaviz-magenta/6 blur-3xl"
        />

        {/* SVG Circuit Traces */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient definitions for traces */}
            <linearGradient id="traceGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gv-gold)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--gv-gold)" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="traceMagenta" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gv-magenta)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--gv-magenta)" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="traceCream" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gv-cream)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--gv-cream)" stopOpacity="0.3" />
            </linearGradient>
            
            {/* Glow filter */}
            <filter id="traceGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Animated pulse gradient */}
            <linearGradient id="pulseGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="var(--gv-gold)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--gv-gold)" stopOpacity="1" />
              <stop offset="60%" stopColor="var(--gv-gold)" stopOpacity="0" />
              <stop offset="100%" stopColor="transparent" />
              <animate attributeName="x1" from="-100%" to="100%" dur="2s" repeatCount="indefinite" />
              <animate attributeName="x2" from="0%" to="200%" dur="2s" repeatCount="indefinite" />
            </linearGradient>
          </defs>

          {/* Draw all circuit traces */}
          {circuitTraces.map((trace, i) => {
            const isActive = activeNode === trace.from || activeNode === trace.to;
            const gradientId = trace.pillar === "create" ? "traceMagenta" 
              : trace.pillar === "commerce" ? "traceCream" 
              : "traceGold";
            
            return (
              <g key={i}>
                {/* Base trace */}
                <path
                  d={trace.path}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={trace.pillar === "core" ? "2" : "1.5"}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  opacity={isActive ? 1 : 0.5}
                  filter={isActive ? "url(#traceGlow)" : undefined}
                  className="transition-all duration-300"
                />
                {/* Pulse overlay for active traces */}
                {isActive && (
                  <path
                    d={trace.path}
                    fill="none"
                    stroke="url(#pulseGold)"
                    strokeWidth="3"
                    strokeLinecap="square"
                    opacity="0.8"
                  />
                )}
              </g>
            );
          })}

          {/* Junction dots at intersections */}
          {[
            { x: 50, y: 15 },  // Top center junction
            { x: 20, y: 50 },  // Left junction
            { x: 80, y: 50 },  // Right junction
            { x: 35.7, y: 60 }, // Bottom left
            { x: 64.3, y: 60 }, // Bottom right
          ].map((junction, i) => (
            <circle
              key={i}
              cx={junction.x}
              cy={junction.y}
              r="2"
              fill="var(--gv-gold)"
              opacity="0.6"
              className="animate-pulse"
            />
          ))}
        </svg>

        {/* Node Cards */}
        {nodes.map((node) => {
          const styles = getPillarStyles(node.pillar);
          const isCore = node.pillar === "core";
          const isActive = activeNode === node.id;
          const pos = getPosition(node.gridX, node.gridY);

          return (
            <Link
              key={node.id}
              href={node.href}
              aria-label={`${node.title}: ${node.subtitle}`}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
              onFocus={() => setActiveNode(node.id)}
              onBlur={() => setActiveNode(null)}
              className={`
                absolute -translate-x-1/2 -translate-y-1/2
                flex flex-col items-center justify-center text-center
                rounded-lg border backdrop-blur-md
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold
                ${styles.border} ${styles.bg} ${styles.glow}
                ${isCore 
                  ? "h-20 w-24 sm:h-24 sm:w-28 lg:h-28 lg:w-32 z-10" 
                  : "h-14 w-16 sm:h-16 sm:w-20 lg:h-18 lg:w-22"
                }
                ${isActive ? "scale-110 z-20" : "hover:scale-105"}
              `}
              style={{ left: pos.left, top: pos.top }}
            >
              {/* Chip pin effect (top/bottom lines) */}
              <div className="absolute -top-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-current opacity-30" />
              <div className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-current opacity-30" />
              
              <span className={`text-[7px] font-bold uppercase tracking-wider sm:text-[8px] lg:text-[9px] ${styles.text}`}>
                {node.title}
              </span>
              <span className="mt-0.5 text-[6px] font-medium text-gigaviz-muted sm:text-[7px] lg:text-[8px]">
                {node.subtitle}
              </span>
              {isCore && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.6)]" />
                  <span className="text-[5px] font-semibold uppercase tracking-wider text-green-500 sm:text-[6px]">
                    Online
                  </span>
                </div>
              )}
            </Link>
          );
        })}

      </div>
    </div>
  );
}
