"use client";

import { useState } from "react";
import Link from "next/link";
import { treeNodes, type NodePillar } from "./ecosystem-tree.data";

/**
 * EcosystemTree - A TRUE tree visualization (NOT orbit/ring)
 * 
 * Visual Structure:
 * - Core at center where trunk meets branches
 * - Community (cream) branch spreads UPWARD as arc at top
 * - Build (magenta) branch spreads to the LEFT
 * - Growth (gold) branch spreads to the RIGHT
 * - Roots at the bottom
 */

function getPillarStyles(pillar: NodePillar) {
  switch (pillar) {
    case "growth":
      return {
        border: "border-gigaviz-gold/40",
        text: "text-gigaviz-gold",
        glow: "shadow-[0_0_20px_-4px_var(--gv-gold)]",
        stroke: "var(--gv-gold)",
      };
    case "build":
      return {
        border: "border-gigaviz-magenta/45",
        text: "text-gigaviz-magenta",
        glow: "shadow-[0_0_24px_-4px_var(--gv-magenta)]",
        stroke: "var(--gv-magenta)",
      };
    case "community":
      return {
        border: "border-gigaviz-cream/25",
        text: "text-gigaviz-cream/90",
        glow: "shadow-[0_0_16px_-4px_var(--gv-cream)]",
        stroke: "var(--gv-cream)",
      };
    case "core":
      return {
        border: "border-gigaviz-gold/50",
        text: "text-gigaviz-gold",
        glow: "shadow-[0_0_32px_-6px_var(--gv-gold)]",
        stroke: "var(--gv-gold)",
      };
  }
}

type Point = { x: number; y: number };

function formatPoint(p: Point) {
  return `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
}

function cubicPath(start: Point, cp1: Point, cp2: Point, end: Point) {
  return `M ${formatPoint(start)} C ${formatPoint(cp1)} ${formatPoint(cp2)} ${formatPoint(end)}`;
}

// Deterministic jitter so curves feel organic but stable
function jitter(id: string, salt: number, scale = 4) {
  const seed = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + salt * 131;
  const s = Math.sin(seed) * 10000;
  const frac = s - Math.floor(s);
  return (frac - 0.5) * scale;
}

// Pillar anchors (main branch bases)
const coreBase: Point = { x: 50, y: 62 };
const trunkTop: Point = { x: 50, y: 32 };
const buildAnchor: Point = { x: 50, y: 14 }; // Build goes upward
const growthAnchor: Point = { x: 78, y: 40 }; // Growth to the right
const communityAnchor: Point = { x: 22, y: 40 }; // Community to the left

const pillarAnchors: Record<NodePillar, Point> = {
  core: trunkTop,
  build: buildAnchor,
  growth: growthAnchor,
  community: communityAnchor,
};

const mainBranchPaths = [
  {
    key: "trunk",
    d: cubicPath(coreBase, { x: 50, y: 54 }, { x: 50, y: 44 }, trunkTop),
    stroke: "var(--gv-gold)",
    width: 3,
  },
  {
    key: "branch-build",
    d: cubicPath(
      trunkTop,
      { x: 50 + jitter("build", 1, 2), y: 26 + jitter("build", 2, 2) },
      { x: 50 + jitter("build", 3, 2), y: 20 + jitter("build", 4, 2) },
      buildAnchor
    ),
    stroke: "var(--gv-magenta)",
    width: 2.2,
  },
  {
    key: "branch-growth",
    d: cubicPath(
      trunkTop,
      { x: 60 + jitter("growth", 1, 2), y: 34 + jitter("growth", 2, 2) },
      { x: 70 + jitter("growth", 3, 2), y: 36 + jitter("growth", 4, 2) },
      growthAnchor
    ),
    stroke: "var(--gv-gold)",
    width: 2.2,
  },
  {
    key: "branch-community",
    d: cubicPath(
      trunkTop,
      { x: 40 + jitter("community", 1, 2), y: 34 + jitter("community", 2, 2) },
      { x: 32 + jitter("community", 3, 2), y: 36 + jitter("community", 4, 2) },
      communityAnchor
    ),
    stroke: "var(--gv-cream)",
    width: 2.2,
  },
];

// Root tendrils emanating from the core base
const rootPaths = [
  { key: "root-left-1", d: cubicPath(coreBase, { x: 42, y: 66 }, { x: 34, y: 72 }, { x: 30, y: 78 }) },
  { key: "root-left-2", d: cubicPath(coreBase, { x: 45, y: 68 }, { x: 38, y: 74 }, { x: 35, y: 82 }) },
  { key: "root-center", d: cubicPath(coreBase, { x: 50, y: 68 }, { x: 50, y: 74 }, { x: 50, y: 80 }) },
  { key: "root-right-1", d: cubicPath(coreBase, { x: 55, y: 68 }, { x: 62, y: 74 }, { x: 65, y: 82 }) },
  { key: "root-right-2", d: cubicPath(coreBase, { x: 58, y: 66 }, { x: 66, y: 72 }, { x: 70, y: 78 }) },
];

export function EcosystemTree() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);

  // Active node drives highlighting (trunk + pillar branch + node branch)
  const activeNode = hoveredNode || focusedNode;
  const activeBranches = new Set<string>();
  if (activeNode) {
    activeBranches.add("trunk");
    const node = treeNodes.find((n) => n.id === activeNode);
    if (node) {
      activeBranches.add(`branch-${node.pillar}`);
      activeBranches.add(`node-branch-${node.id}`);
    }
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[540px] items-center justify-center lg:max-w-[600px]">
      {/* Container matching hero height with proper aspect ratio */}
      <div className="relative w-full" style={{ aspectRatio: "1 / 1", maxHeight: "520px" }}>
        {/* Ambient background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-15%] rounded-full bg-gradient-to-t from-gigaviz-gold/10 via-transparent to-gigaviz-magenta/8 blur-3xl"
        />

        {/* SVG TREE STRUCTURE - ViewBox 0-100 matching node percentages */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 110"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow filter for highlighted branches */}
            <filter id="branchGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ROOTS (decorative, curved) */}
          <g opacity="0.5">
            {rootPaths.map((root) => (
              <path
                key={root.key}
                d={root.d}
                fill="none"
                stroke="var(--gv-gold)"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.55"
              />
            ))}
          </g>

          {/* TRUNK & MAIN BRANCHES */}
          {mainBranchPaths.map((branch) => {
            const isHighlighted = activeBranches.has(branch.key);
            return (
              <path
                key={branch.key}
                d={branch.d}
                fill="none"
                stroke={branch.stroke}
                strokeWidth={branch.width}
                strokeLinecap="round"
                opacity={isHighlighted ? 0.95 : 0.35}
                filter={isHighlighted ? "url(#branchGlow)" : undefined}
                className="transition-all duration-300"
              />
            );
          })}

          {/* NODE BRANCHES - from pillar anchor to node with organic Beziers */}
          {treeNodes.map((node) => {
            const anchor = pillarAnchors[node.pillar];
            const end: Point = { x: node.x, y: node.y };
            const dx = end.x - anchor.x;
            const dy = end.y - anchor.y;
            const cp1: Point = {
              x: anchor.x + dx * 0.35 + jitter(node.id, 1),
              y: anchor.y + dy * 0.25 + jitter(node.id, 2),
            };
            const cp2: Point = {
              x: anchor.x + dx * 0.75 + jitter(node.id, 3),
              y: anchor.y + dy * 0.55 + jitter(node.id, 4),
            };
            const pathD = cubicPath(anchor, cp1, cp2, end);
            const stroke = getPillarStyles(node.pillar).stroke;
            const key = `node-branch-${node.id}`;
            const isHighlighted = activeBranches.has(key);

            return (
              <path
                key={key}
                d={pathD}
                fill="none"
                stroke={stroke}
                strokeWidth={1.6}
                strokeLinecap="round"
                opacity={isHighlighted ? 0.9 : 0.32}
                filter={isHighlighted ? "url(#branchGlow)" : undefined}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* CLICKABLE NODE OVERLAYS */}
        {treeNodes.map((node) => {
          const styles = getPillarStyles(node.pillar);
          const isCore = node.pillar === "core";
          const isActive = activeNode === node.id;

          return (
            <Link
              key={node.id}
              href={node.href}
              aria-label={`${node.title}: ${node.subtitle}`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onFocus={() => setFocusedNode(node.id)}
              onBlur={() => setFocusedNode(null)}
              className={`
                absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center
                rounded-xl border bg-gigaviz-card/95 backdrop-blur-md
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gigaviz-bg
                ${styles.border} ${styles.glow}
                ${isCore 
                  ? "h-[88px] w-[88px] sm:h-[100px] sm:w-[100px] lg:h-[112px] lg:w-[112px] z-10" 
                  : "h-14 w-14 sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]"
                }
                ${isActive ? "scale-110 z-20" : "hover:scale-105 hover:z-15"}
              `}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <span
                className={`block w-full text-center text-[8px] font-extrabold uppercase tracking-tight sm:text-[9px] lg:text-[10px] ${styles.text} ${
                  isCore ? "text-[9px] sm:text-[10px] lg:text-xs" : ""
                }`}
              >
                {node.title}
              </span>
              <span
                className={`mt-0.5 block w-full text-center text-[7px] font-semibold tracking-tight text-gigaviz-muted sm:text-[8px] lg:text-[9px] ${
                  isCore ? "text-[8px] sm:text-[9px] lg:text-[10px]" : ""
                }`}
              >
                {node.subtitle}
              </span>
              {isCore && (
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.6)]" />
                  <span className="text-[6px] font-semibold uppercase tracking-wider text-green-500 sm:text-[7px]">
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
