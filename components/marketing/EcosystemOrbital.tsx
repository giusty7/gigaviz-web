"use client";

import { useState } from "react";
import Link from "next/link";

type NodePillar = "core" | "connect" | "create" | "commerce";

interface OrbitNode {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  pillar: NodePillar;
  orbit: number;      // 1, 2, or 3 (inner to outer)
  angle: number;       // degrees position on orbit
}

// Orbital Layout - 3 tilted rings around central core (7 products)
const nodes: OrbitNode[] = [
  // CORE - Center
  { id: "core", title: "GIGAVIZ", subtitle: "Platform Core", href: "/products/platform", pillar: "core", orbit: 0, angle: 0 },

  // ORBIT 1 - Inner ring (Create - magenta)
  { id: "helper", title: "HELPER", subtitle: "AI Assistant", href: "/products/helper", pillar: "create", orbit: 1, angle: 0 },
  { id: "studio", title: "STUDIO", subtitle: "Creative Suite", href: "/products/studio", pillar: "create", orbit: 1, angle: 120 },
  { id: "office", title: "OFFICE", subtitle: "AI Documents", href: "/products/office", pillar: "create", orbit: 1, angle: 240 },

  // ORBIT 2 - Middle ring (Connect - gold)
  { id: "meta_hub", title: "META HUB", subtitle: "WhatsApp API", href: "/products/meta-hub", pillar: "connect", orbit: 2, angle: 90 },

  // ORBIT 3 - Outer ring (Commerce - cream)
  { id: "marketplace", title: "MARKETPLACE", subtitle: "Digital Products", href: "/products/marketplace", pillar: "commerce", orbit: 3, angle: 60 },
  { id: "apps", title: "APPS", subtitle: "Integrations", href: "/products/apps", pillar: "commerce", orbit: 3, angle: 200 },
];

// Orbit ring configurations (radiusX, radiusY for ellipse, tilt)
const orbitConfigs = [
  { rx: 0, ry: 0, tilt: 0 },           // Core (no orbit)
  { rx: 22, ry: 12, tilt: -15 },       // Inner - Build (magenta)
  { rx: 34, ry: 18, tilt: 10 },        // Middle - Growth (gold)
  { rx: 46, ry: 24, tilt: -5 },        // Outer - Community (cream)
];

const orbitColors = {
  1: "var(--gv-magenta)",
  2: "var(--gv-gold)",
  3: "var(--gv-cream)",
};

function getPillarStyles(pillar: NodePillar) {
  switch (pillar) {
    case "connect":
      return {
        border: "border-gigaviz-gold/50",
        bg: "bg-gigaviz-card/90",
        text: "text-gigaviz-gold",
        glow: "shadow-[0_0_24px_-4px_var(--gv-gold),0_0_48px_-8px_var(--gv-gold)]",
      };
    case "create":
      return {
        border: "border-gigaviz-magenta/50",
        bg: "bg-gigaviz-card/90",
        text: "text-gigaviz-magenta",
        glow: "shadow-[0_0_24px_-4px_var(--gv-magenta),0_0_48px_-8px_var(--gv-magenta)]",
      };
    case "commerce":
      return {
        border: "border-gigaviz-cream/40",
        bg: "bg-gigaviz-card/90",
        text: "text-gigaviz-cream",
        glow: "shadow-[0_0_20px_-4px_var(--gv-cream)]",
      };
    case "core":
      return {
        border: "border-gigaviz-gold/60",
        bg: "bg-gradient-to-br from-gigaviz-gold/20 to-gigaviz-card",
        text: "text-gigaviz-gold",
        glow: "shadow-[0_0_40px_-4px_var(--gv-gold),0_0_80px_-8px_var(--gv-gold)]",
      };
  }
}

// Calculate node position on tilted elliptical orbit
function getNodePosition(orbit: number, angle: number) {
  if (orbit === 0) return { x: 50, y: 50 }; // Core at center
  
  const config = orbitConfigs[orbit];
  const rad = (angle * Math.PI) / 180;
  const tiltRad = (config.tilt * Math.PI) / 180;
  
  // Position on ellipse
  const x = config.rx * Math.cos(rad);
  const y = config.ry * Math.sin(rad);
  
  // Apply tilt rotation
  const rotatedX = x * Math.cos(tiltRad) - y * Math.sin(tiltRad);
  const rotatedY = x * Math.sin(tiltRad) + y * Math.cos(tiltRad);
  
  return {
    x: 50 + rotatedX,
    y: 50 + rotatedY,
  };
}

export function EcosystemOrbital() {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeOrbit, setActiveOrbit] = useState<number | null>(null);

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[580px] items-center justify-center lg:max-w-[640px]">
      <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
        
        {/* Deep space ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-20%] rounded-full bg-gradient-radial from-gigaviz-gold/10 via-transparent to-transparent blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[10%] rounded-full bg-gradient-radial from-gigaviz-magenta/8 via-transparent to-transparent blur-2xl"
        />

        {/* SVG Orbital Rings */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Orbit glow filters */}
            <filter id="orbitGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Animated dash for active orbit */}
            <linearGradient id="orbitPulse" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.8" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Draw orbital rings (back to front for proper layering) */}
          {[3, 2, 1].map((orbitNum) => {
            const config = orbitConfigs[orbitNum];
            const color = orbitColors[orbitNum as 1 | 2 | 3];
            const isActive = activeOrbit === orbitNum;
            
            return (
              <g key={orbitNum} transform={`rotate(${config.tilt} 50 50)`}>
                {/* Orbit ring */}
                <ellipse
                  cx="50"
                  cy="50"
                  rx={config.rx}
                  ry={config.ry}
                  fill="none"
                  stroke={color}
                  strokeWidth={isActive ? "1.2" : "0.6"}
                  strokeDasharray={isActive ? "none" : "2 3"}
                  opacity={isActive ? 0.9 : 0.4}
                  filter={isActive ? "url(#orbitGlow)" : undefined}
                  className="transition-all duration-500"
                />
                
                {/* Animated orbit highlight when active */}
                {isActive && (
                  <ellipse
                    cx="50"
                    cy="50"
                    rx={config.rx}
                    ry={config.ry}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="8 92"
                    opacity="0.8"
                    className="animate-[spin_8s_linear_infinite]"
                    style={{ transformOrigin: "50px 50px" }}
                  />
                )}
              </g>
            );
          })}

          {/* Center core glow ring */}
          <circle
            cx="50"
            cy="50"
            r="10"
            fill="none"
            stroke="var(--gv-gold)"
            strokeWidth="0.5"
            opacity="0.3"
            strokeDasharray="2 2"
          />
          <circle
            cx="50"
            cy="50"
            r="6"
            fill="url(#coreGradient)"
            opacity="0.15"
          />
          <defs>
            <radialGradient id="coreGradient">
              <stop offset="0%" stopColor="var(--gv-gold)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>

        {/* Node Cards */}
        {nodes.map((node) => {
          const styles = getPillarStyles(node.pillar);
          const isCore = node.pillar === "core";
          const isActive = activeNode === node.id;
          const pos = getNodePosition(node.orbit, node.angle);

          return (
            <Link
              key={node.id}
              href={node.href}
              aria-label={`${node.title}: ${node.subtitle}`}
              onMouseEnter={() => {
                setActiveNode(node.id);
                setActiveOrbit(node.orbit);
              }}
              onMouseLeave={() => {
                setActiveNode(null);
                setActiveOrbit(null);
              }}
              onFocus={() => {
                setActiveNode(node.id);
                setActiveOrbit(node.orbit);
              }}
              onBlur={() => {
                setActiveNode(null);
                setActiveOrbit(null);
              }}
              className={`
                absolute -translate-x-1/2 -translate-y-1/2
                flex flex-col items-center justify-center text-center
                rounded-xl border backdrop-blur-md
                transition-all duration-300
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold
                ${styles.border} ${styles.bg} ${styles.glow}
                ${isCore 
                  ? "h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 z-20" 
                  : "h-14 w-14 sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]"
                }
                ${isActive ? "scale-115 z-30" : "hover:scale-110 z-10"}
              `}
              style={{ 
                left: `${pos.x}%`, 
                top: `${pos.y}%`,
              }}
            >
              <span className={`text-[8px] font-bold uppercase tracking-wider sm:text-[9px] lg:text-[10px] ${styles.text}`}>
                {node.title}
              </span>
              <span className="mt-0.5 text-[6px] font-medium text-gigaviz-muted sm:text-[7px] lg:text-[8px]">
                {node.subtitle}
              </span>
              {isCore && (
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]" />
                  <span className="text-[6px] font-semibold uppercase tracking-wider text-green-500 sm:text-[7px]">
                    Online
                  </span>
                </div>
              )}
            </Link>
          );
        })}

        {/* Orbit Labels (subtle, outside rings) */}
        <div className="pointer-events-none absolute left-[8%] top-[30%] -rotate-12 text-[7px] font-medium uppercase tracking-widest text-gigaviz-magenta/40 sm:text-[8px]">
          Create
        </div>
        <div className="pointer-events-none absolute right-[5%] top-[25%] rotate-6 text-[7px] font-medium uppercase tracking-widest text-gigaviz-gold/40 sm:text-[8px]">
          Connect
        </div>
        <div className="pointer-events-none absolute bottom-[15%] left-[12%] -rotate-3 text-[7px] font-medium uppercase tracking-widest text-gigaviz-cream/30 sm:text-[8px]">
          Commerce
        </div>

      </div>
    </div>
  );
}
