// Ecosystem Tree Node Data Configuration
// Positions are in percentages relative to a 100x100 coordinate system
// Tree Structure: Core at center, Build (magenta) LEFT, Growth (gold) RIGHT, Community (cream) TOP

export type NodePillar = "core" | "growth" | "build" | "community";

export interface TreeNode {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  pillar: NodePillar;
  /** X position as percentage (0-100), 50 = center */
  x: number;
  /** Y position as percentage (0-100), 100 = bottom, 0 = top */
  y: number;
}

/**
 * POLISHED Node Layout (Tree Structure):
 * 
 *        [Community]  [Arena]  [Marketplace]  [Apps]     <- TOP cluster (cream, evenly spaced arc)
 *              \        \          /        /
 *               \        \        /        /
 *   [Helper]     \________\______/________/     [Meta Hub]
 *       \                   |                      /
 *   [Studio]         [CORE/TRUNK]            [Pay]        <- Core at center
 *       /                   |                      \
 *   [Office]               |                   [Trade]
 *                       (roots)
 * 
 * LEFT = Build (magenta): Helper, Studio, Office
 * RIGHT = Growth (gold): Meta Hub, Pay, Trade
 * TOP = Community (cream): Community, Arena, Marketplace, Apps
 */

export const treeNodes: TreeNode[] = [
  // CORE - Center trunk (the heart of the tree)
  {
    id: "core",
    title: "GIGAVIZ PLATFORM",
    subtitle: "Auth · Billing · Audit",
    href: "/products/platform",
    pillar: "core",
    x: 50,
    y: 50,
  },

  // COMMUNITY BRANCH - TOP cluster (cream accent) - evenly spaced arc
  {
    id: "community",
    title: "COMMUNITY",
    subtitle: "Feedback",
    href: "/products/community",
    pillar: "community",
    x: 20,
    y: 12,
  },
  {
    id: "arena",
    title: "ARENA",
    subtitle: "Engagement",
    href: "/products/arena",
    pillar: "community",
    x: 40,
    y: 8,
  },
  {
    id: "marketplace",
    title: "MARKETPLACE",
    subtitle: "Templates",
    href: "/products/marketplace",
    pillar: "community",
    x: 60,
    y: 8,
  },
  {
    id: "apps",
    title: "APPS",
    subtitle: "App Catalog",
    href: "/products/apps",
    pillar: "community",
    x: 80,
    y: 12,
  },

  // 
  // BUILD BRANCH - LEFT side (magenta accent)
  // 
  {
    id: "helper",
    title: "HELPER",
    subtitle: "AI Copilot",
    href: "/products/helper",
    pillar: "build",
    x: 12,
    y: 35,
  },
  {
    id: "studio",
    title: "STUDIO",
    subtitle: "Graph/Tracks",
    href: "/products/studio",
    pillar: "build",
    x: 10,
    y: 55,
  },
  {
    id: "office",
    title: "OFFICE",
    subtitle: "Sheets/Excel",
    href: "/products/office",
    pillar: "build",
    x: 15,
    y: 75,
  },

  // 
  // GROWTH BRANCH - RIGHT side (gold accent)
  // 
  {
    id: "meta_hub",
    title: "META HUB",
    subtitle: "WhatsApp API",
    href: "/products/meta-hub",
    pillar: "growth",
    x: 88,
    y: 35,
  },
  {
    id: "pay",
    title: "PAY",
    subtitle: "Billing",
    href: "/products/pay",
    pillar: "growth",
    x: 90,
    y: 55,
  },
  {
    id: "trade",
    title: "TRADE",
    subtitle: "Insights",
    href: "/products/trade",
    pillar: "growth",
    x: 85,
    y: 75,
  },
];

// Branch path definitions for SVG
// Updated paths to match new node positions
export const branchPaths = {
  // Main trunk: vertical from roots through core
  trunk: "M 50 95 L 50 50",

  // Community branch paths (TOP - spreading upward as arc)
  communityLeft: "M 50 50 Q 35 30, 20 12",      // to Community
  communityMidLeft: "M 50 50 Q 45 28, 40 8",    // to Arena
  communityMidRight: "M 50 50 Q 55 28, 60 8",   // to Marketplace
  communityRight: "M 50 50 Q 65 30, 80 12",     // to Apps

  // Build branch paths (LEFT side)
  buildUpper: "M 50 50 Q 30 42, 12 35",        // to Helper
  buildMiddle: "M 50 50 Q 28 52, 10 55",       // to Studio
  buildLower: "M 50 50 Q 32 62, 15 75",        // to Office

  // Growth branch paths (RIGHT side)
  growthUpper: "M 50 50 Q 70 42, 88 35",       // to Meta Hub
  growthMiddle: "M 50 50 Q 72 52, 90 55",      // to Pay
  growthLower: "M 50 50 Q 68 62, 85 75",       // to Trade

  // Roots (decorative, below trunk)
  rootLeft: "M 50 95 Q 35 100, 25 105",
  rootCenter: "M 50 95 L 50 105",
  rootRight: "M 50 95 Q 65 100, 75 105",
};

// Map nodes to their branch paths for hover highlighting
export const nodeToBranch: Record<string, string[]> = {
  core: ["trunk"],
  // Community (top)
  community: ["trunk", "communityLeft"],
  arena: ["trunk", "communityMidLeft"],
  marketplace: ["trunk", "communityMidRight"],
  apps: ["trunk", "communityRight"],
  // Build (left)
  helper: ["trunk", "buildUpper"],
  studio: ["trunk", "buildMiddle"],
  office: ["trunk", "buildLower"],
  // Growth (right)
  meta_hub: ["trunk", "growthUpper"],
  pay: ["trunk", "growthMiddle"],
  trade: ["trunk", "growthLower"],
};
