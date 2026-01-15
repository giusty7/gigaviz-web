"use client";

import Link from "next/link";

type NodeAccent = "gold" | "magenta" | "neutral";

interface ModuleNode {
  id: string;
  label: string;
  sub: string;
  href: string;
  accent: NodeAccent;
}

const modules: ModuleNode[] = [
  { id: "meta_hub", label: "Meta Hub", sub: "WhatsApp API", href: "/products/meta-hub", accent: "gold" },
  { id: "helper", label: "Helper", sub: "AI Copilot", href: "/products/helper", accent: "magenta" },
  { id: "studio", label: "Studio", sub: "Graph/Tracks", href: "/products/studio", accent: "gold" },
  { id: "office", label: "Office", sub: "Sheets/Excel", href: "/products/office", accent: "neutral" },
  { id: "marketplace", label: "Marketplace", sub: "Templates", href: "/products/marketplace", accent: "neutral" },
  { id: "apps", label: "Apps", sub: "App Catalog", href: "/products/apps", accent: "neutral" },
  { id: "pay", label: "Pay", sub: "Billing", href: "/products/pay", accent: "gold" },
  { id: "trade", label: "Trade", sub: "Insights", href: "/products/trade", accent: "neutral" },
  { id: "arena", label: "Arena", sub: "Engagement", href: "/products/arena", accent: "neutral" },
  { id: "community", label: "Community", sub: "Feedback", href: "/products/community", accent: "neutral" },
];

// Secondary mesh connections (subtle inter-node lines)
const meshConnections: [string, string][] = [
  ["meta_hub", "apps"],
  ["studio", "marketplace"],
  ["helper", "office"],
];

// Get accent classes - enhanced with glow filters
function getAccentClasses(accent: NodeAccent) {
  switch (accent) {
    case "gold":
      return {
        glow: "shadow-[0_0_24px_-4px_var(--gv-gold),0_0_48px_-12px_var(--gv-gold)]",
        border: "border-gigaviz-gold/35",
        text: "text-gigaviz-gold",
        lineGlow: "drop-shadow-[0_0_6px_var(--gv-gold)]",
      };
    case "magenta":
      return {
        glow: "shadow-[0_0_28px_-4px_var(--gv-magenta),0_0_56px_-12px_var(--gv-magenta)]",
        border: "border-gigaviz-magenta/40",
        text: "text-gigaviz-magenta",
        lineGlow: "drop-shadow-[0_0_8px_var(--gv-magenta)]",
      };
    default:
      return {
        glow: "shadow-[0_0_16px_-4px_var(--gv-cream)]",
        border: "border-gigaviz-cream/20",
        text: "text-gigaviz-cream/90",
        lineGlow: "",
      };
  }
}

export function EcosystemGraph() {
  const nodeCount = modules.length;
  const cx = 220; // center x
  const cy = 220; // center y
  const radius = 175; // ring radius - slightly larger for breathing room

  // Calculate node positions
  const nodePositions = modules.map((_, i) => {
    const angle = (i * 2 * Math.PI) / nodeCount - Math.PI / 2; // Start from top
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  // Get mesh connection coordinates
  const meshLines = meshConnections.map(([fromId, toId]) => {
    const fromIdx = modules.findIndex((m) => m.id === fromId);
    const toIdx = modules.findIndex((m) => m.id === toId);
    if (fromIdx === -1 || toIdx === -1) return null;
    return {
      x1: nodePositions[fromIdx].x,
      y1: nodePositions[fromIdx].y,
      x2: nodePositions[toIdx].x,
      y2: nodePositions[toIdx].y,
    };
  }).filter(Boolean);

  return (
    <div className="relative mx-auto w-full max-w-[500px] lg:max-w-[550px]">
      {/* Container maintains aspect ratio */}
      <div className="relative aspect-square w-full">
        {/* Ambient glow behind everything */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-15%] rounded-full bg-gradient-to-br from-gigaviz-gold/12 via-transparent to-gigaviz-magenta/10 blur-3xl"
        />

        {/* SVG for connection lines - Desktop */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
          viewBox="0 0 440 440"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="lineGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gv-gold)" stopOpacity="0.25" />
              <stop offset="50%" stopColor="var(--gv-gold)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--gv-gold)" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="lineMagenta" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gv-magenta)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="var(--gv-magenta)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--gv-magenta)" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="lineNeutral" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gv-cream)" stopOpacity="0.12" />
              <stop offset="50%" stopColor="var(--gv-cream)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--gv-cream)" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="meshLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gv-cream)" stopOpacity="0.05" />
              <stop offset="50%" stopColor="var(--gv-cream)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--gv-cream)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Mesh connections (secondary, subtle) */}
          {meshLines.map((line, i) => (
            line && (
              <line
                key={`mesh-${i}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="url(#meshLine)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            )
          ))}

          {/* Core to node connections - thicker with glow */}
          {modules.map((mod, i) => {
            const pos = nodePositions[i];
            const gradId =
              mod.accent === "gold"
                ? "url(#lineGold)"
                : mod.accent === "magenta"
                ? "url(#lineMagenta)"
                : "url(#lineNeutral)";
            const accentStyles = getAccentClasses(mod.accent);
            return (
              <line
                key={mod.id}
                x1={cx}
                y1={cy}
                x2={pos.x}
                y2={pos.y}
                stroke={gradId}
                strokeWidth="2"
                strokeLinecap="round"
                className={accentStyles.lineGlow}
              />
            );
          })}
        </svg>

        {/* Module nodes - Desktop ring layout (larger nodes) */}
        <div className="hidden md:block">
          {modules.map((mod, i) => {
            const pos = nodePositions[i];
            const accentStyles = getAccentClasses(mod.accent);
            // Convert SVG coords to percentage
            const left = (pos.x / 440) * 100;
            const top = (pos.y / 440) * 100;

            return (
              <Link
                key={mod.id}
                href={mod.href}
                aria-label={`${mod.label}: ${mod.sub}`}
                className={`
                  absolute flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center
                  rounded-xl border bg-gigaviz-card/90 backdrop-blur-md
                  transition-all duration-200 hover:scale-110 hover:z-20
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gigaviz-bg
                  ${accentStyles.border} ${accentStyles.glow}
                `}
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <span className={`text-[11px] font-extrabold uppercase tracking-[-0.02em] ${accentStyles.text}`}>
                  {mod.label}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold tracking-tight text-gigaviz-muted">{mod.sub}</span>
              </Link>
            );
          })}
        </div>

        {/* Module nodes - Tablet (2 columns beside core) */}
        <div className="hidden max-md:hidden sm:hidden md:hidden">
          {/* Tablet layout handled by responsive grid below */}
        </div>

        {/* Core node - Larger cream surface with enhanced glow */}
        <div
          className="absolute left-1/2 top-1/2 z-10 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl md:h-36 md:w-36"
          style={{
            background: "linear-gradient(135deg, hsla(38 52% 94% / 0.98) 0%, hsla(38 48% 90% / 0.96) 100%)",
            boxShadow: `
              0 0 0 1px hsla(42 62% 62% / 0.4),
              0 0 48px -8px var(--gv-gold),
              0 20px 60px -16px hsla(42 62% 62% / 0.55)
            `,
          }}
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gigaviz-gold">Core</span>
          <span className="mt-1 text-sm font-bold text-gigaviz-navy">Gigaviz Platform</span>
          <span className="mt-0.5 text-[10px] font-medium text-gigaviz-navy/60">Auth · Billing · Audit</span>
          <div className="mt-2 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.65)]" />
            <span className="text-[8px] font-semibold uppercase tracking-wider text-green-600">Online</span>
          </div>
        </div>
      </div>

      {/* Mobile layout: stacked grid with improved typography */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:hidden">
        {modules.map((mod) => {
          const accentStyles = getAccentClasses(mod.accent);
          return (
            <Link
              key={mod.id}
              href={mod.href}
              aria-label={`${mod.label}: ${mod.sub}`}
              className={`
                flex flex-col items-center justify-center rounded-xl border bg-gigaviz-card/90 p-3.5 backdrop-blur-md
                transition-all duration-200 hover:scale-[1.03]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold
                ${accentStyles.border} ${accentStyles.glow}
              `}
            >
              <span className={`text-[11px] font-extrabold uppercase tracking-[-0.02em] ${accentStyles.text}`}>
                {mod.label}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold tracking-tight text-gigaviz-muted">{mod.sub}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
