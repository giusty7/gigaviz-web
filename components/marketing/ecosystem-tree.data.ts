// Ecosystem Tree Node Data Configuration
// Positions are in percentages relative to a 100x100 coordinate system
// Tree Structure: Core at center, Create (magenta) LEFT, Connect (gold) RIGHT, Commerce (cream) TOP

export type NodePillar = "core" | "connect" | "create" | "commerce";

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
 * 7-Product Ecosystem Layout (Tree Structure):
 * 
 *              [Marketplace]     [Apps]                   <- TOP cluster (commerce)
 *                     \          /
 *                      \        /
 *   [Helper]            \______/            [Meta Hub]    <- Upper branches
 *       \                  |                   /
 *   [Studio]         [PLATFORM]                           <- Core at center
 *    /   |  \           (trunk)
 * [Office] [Graph] [Tracks]                               <- Studio children (roots)
 *
 * LEFT = Create (magenta): Helper, Studio, Office, Graph, Tracks
 * RIGHT = Connect (gold): Meta Hub
 * TOP = Commerce (cream): Marketplace, Apps
 */

export const treeNodes: TreeNode[] = [
  // CORE - Center trunk (the heart of the tree)
  {
    id: "core",
    title: "GIGAVIZ PLATFORM",
    subtitle: "Auth · Billing · Payments · Audit",
    href: "/products/platform",
    pillar: "core",
    x: 50,
    y: 50,
  },

  // COMMERCE BRANCH - TOP cluster (cream accent)
  {
    id: "marketplace",
    title: "MARKETPLACE",
    subtitle: "Digital Products",
    href: "/products/marketplace",
    pillar: "commerce",
    x: 35,
    y: 8,
  },
  {
    id: "apps",
    title: "APPS",
    subtitle: "Integrations",
    href: "/products/apps",
    pillar: "commerce",
    x: 65,
    y: 8,
  },

  // CREATE BRANCH - LEFT side (magenta accent)
  {
    id: "helper",
    title: "HELPER",
    subtitle: "AI Engine",
    href: "/products/helper",
    pillar: "create",
    x: 12,
    y: 30,
  },
  {
    id: "studio",
    title: "STUDIO",
    subtitle: "Creative Suite",
    href: "/products/studio",
    pillar: "create",
    x: 10,
    y: 55,
  },
  {
    id: "office",
    title: "OFFICE",
    subtitle: "Excel · Word · PDF",
    href: "/products/office",
    pillar: "create",
    x: 5,
    y: 80,
  },
  {
    id: "graph",
    title: "GRAPH",
    subtitle: "Image · Video",
    href: "/products/graph",
    pillar: "create",
    x: 22,
    y: 85,
  },
  {
    id: "tracks",
    title: "TRACKS",
    subtitle: "Music · Audio",
    href: "/products/tracks",
    pillar: "create",
    x: 38,
    y: 80,
  },

  // CONNECT BRANCH - RIGHT side (gold accent)
  {
    id: "meta_hub",
    title: "META HUB",
    subtitle: "WhatsApp · IG · Messenger",
    href: "/products/meta-hub",
    pillar: "connect",
    x: 88,
    y: 35,
  },
];

// Branch path definitions for SVG
export const branchPaths = {
  // Main trunk: vertical from roots through core
  trunk: "M 50 95 L 50 50",

  // Commerce branch paths (TOP - spreading upward)
  commerceLeft: "M 50 50 Q 42 28, 35 8",        // to Marketplace
  commerceRight: "M 50 50 Q 58 28, 65 8",       // to Apps

  // Create branch paths (LEFT side)
  createUpper: "M 50 50 Q 30 38, 12 30",        // to Helper
  createMiddle: "M 50 50 Q 28 52, 10 55",       // to Studio
  createOffice: "M 10 55 Q 7 68, 5 80",         // Studio to Office
  createGraph: "M 10 55 Q 16 70, 22 85",        // Studio to Graph
  createTracks: "M 10 55 Q 24 68, 38 80",       // Studio to Tracks

  // Connect branch paths (RIGHT side)
  connectUpper: "M 50 50 Q 70 42, 88 35",       // to Meta Hub

  // Roots (decorative, below trunk)
  rootLeft: "M 50 95 Q 35 100, 25 105",
  rootCenter: "M 50 95 L 50 105",
  rootRight: "M 50 95 Q 65 100, 75 105",
};

// Map nodes to their branch paths for hover highlighting
export const nodeToBranch: Record<string, string[]> = {
  core: ["trunk"],
  // Commerce (top)
  marketplace: ["trunk", "commerceLeft"],
  apps: ["trunk", "commerceRight"],
  // Create (left)
  helper: ["trunk", "createUpper"],
  studio: ["trunk", "createMiddle"],
  office: ["trunk", "createMiddle", "createOffice"],
  graph: ["trunk", "createMiddle", "createGraph"],
  tracks: ["trunk", "createMiddle", "createTracks"],
  // Connect (right)
  meta_hub: ["trunk", "connectUpper"],
};
