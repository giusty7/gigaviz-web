/**
 * Ops Console Theme Configuration
 * 
 * Centralized theme settings for internal ops platform.
 * Extract values here to ensure consistency across all ops pages.
 */

export const opsTheme = {
  // Colors
  colors: {
    primary: "#d4af37",       // Gold
    background: "#050a18",     // Deep navy
    backgroundAlt: "#040815",  // Darker navy
    backgroundLight: "#0a1229", // Lighter navy
    text: "#f5f5dc",          // Beige
    textMuted: "#f5f5dc",     // Muted beige (70% opacity applied in components)
    border: "#d4af37",        // Gold border
  },

  // Opacity values
  opacity: {
    batik: 1.0,
    primary: {
      border: 0.40,
      borderLight: 0.25,
      borderHover: 0.60,
      borderActive: 0.80,
      bg: 0.15,
      bgAlt: 0.06,
    },
    background: {
      card: 0.60,
      header: 0.80,
      nav: 0.80,
      badge: 0.70,
    },
    text: {
      muted: 0.70,
      veryMuted: 0.60,
    },
  },

  // Shadow effects
  shadows: {
    card: "0_30px_80px_-50px_rgba(0,0,0,0.7)",
    activeTab: "0_0_20px_rgba(212,175,55,0.25)",
    glow: "0_0_24px_rgba(212,175,55,0.4)",
  },

  // Typography
  typography: {
    badge: {
      size: "11px",
      tracking: "wide",
    },
    subtitle: {
      size: "xs",
      tracking: "0.2em",
    },
  },

  // Watermark
  watermark: {
    text: "INTERNAL ACCESS",
    opacity: 0.06,
    rotation: -30,
    size: 280,
  },

  // Navigation - organized by category
  nav: {
    items: [
      // Home
      { label: "Dashboard", href: "/ops", icon: "Home", group: "home" },
      // Core Operations
      { label: "Command", href: "/ops/god-console", icon: "LayoutPanelLeft", group: "core" },
      { label: "Workspaces", href: "/ops/workspaces", icon: "Building2", group: "core" },
      { label: "Customers", href: "/ops/customers", icon: "Users", group: "core" },
      // Support
      { label: "Tickets", href: "/ops/tickets", icon: "Ticket", group: "support" },
      // Monitoring
      { label: "Health", href: "/ops/health", icon: "HeartPulse", group: "monitoring" },
      { label: "Logs", href: "/ops/audit", icon: "ScrollText", group: "monitoring" },
      // Business
      { label: "Analytics", href: "/ops/analytics", icon: "BarChart3", group: "business" },
      { label: "Operations", href: "/ops/operations", icon: "Zap", group: "business" },
      // Developer
      { label: "Dev Tools", href: "/ops/dev-tools", icon: "Code", group: "developer" },
    ],
    groups: [
      { id: "home", label: "Home" },
      { id: "core", label: "Core" },
      { id: "support", label: "Support" },
      { id: "monitoring", label: "Monitoring" },
      { id: "business", label: "Business" },
      { id: "developer", label: "Developer" },
    ],
  },

  // Header
  header: {
    subtitle: "Imperium Internal Ops",
    title: "Ops Console",
    description: "Sovereign control for workspaces, billing, plans, logs, and manual overrides.",
  },
} as const;

// Type-safe theme access
export type OpsTheme = typeof opsTheme;

/**
 * Generate CSS variable string for inline styles
 */
export function getOpsColorVar(color: keyof typeof opsTheme.colors, opacity?: number): string {
  const hex = opsTheme.colors[color];
  if (!opacity) return hex;
  
  // Convert hex to rgba with opacity
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

/**
 * Generate batik overlay background
 */
export function getBatikOverlay(): string {
  return "batik-overlay";
}

/**
 * Generate watermark SVG data URL
 */
export function getWatermarkSvg(
  text: string = opsTheme.watermark.text,
  opacity: number = opsTheme.watermark.opacity
): string {
  const { size, rotation } = opsTheme.watermark;
  const color = getOpsColorVar("primary", opacity);
  
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Ctext x='30' y='140' font-family='Inter' font-size='34' fill='${color}' transform='rotate(${rotation} 140 140)'%3E${text}%3C/text%3E%3C/svg%3E")`;
}
