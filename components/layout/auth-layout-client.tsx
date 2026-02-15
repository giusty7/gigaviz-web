"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AUTH_DISCLAIMER_LINES } from "@/lib/copy";
import { AuthTrustBadge } from "./auth-trust-badge";
import { PillarGrid } from "./pillar-grid";

type AuthLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  disclaimerLines?: readonly [string, string];
  /** Show the Technology Provider trust badge */
  showTrustBadge?: boolean;
  /** Show the 7-product ecosystem grid */
  showPillarGrid?: boolean;
};

/** 
 * Pre-computed constellation node positions (8 nodes for 8 products)
 * Distributed in a pleasing pattern across the viewport
 */
const CONSTELLATION_NODES = [
  { x: 15, y: 20 },
  { x: 40, y: 12 },
  { x: 65, y: 22 },
  { x: 88, y: 15 },
  { x: 25, y: 60 },
  { x: 50, y: 55 },
  { x: 75, y: 65 },
  { x: 90, y: 50 },
];

/** Pre-computed connections between nodes */
const CONSTELLATION_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3],
  [0, 4], [4, 5], [5, 6],
  [1, 5], [2, 6], [3, 6],
  [4, 1], [5, 2], [6, 7], [3, 7],
];

export function AuthLayoutClient({
  title,
  description,
  children,
  footer,
  disclaimerLines = AUTH_DISCLAIMER_LINES,
  showTrustBadge = true,
  showPillarGrid = true,
}: AuthLayoutProps) {
  const [disclaimerLine1, disclaimerLine2] = disclaimerLines;

  return (
    <div className="auth-layout min-h-screen bg-[#050a18] text-[#f5f5dc]">
      {/* Animated Constellation Background */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]" />
        
        {/* Constellation SVG */}
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Connection lines */}
          {CONSTELLATION_CONNECTIONS.map(([from, to], idx) => {
            const nodeFrom = CONSTELLATION_NODES[from];
            const nodeTO = CONSTELLATION_NODES[to];
            return (
              <motion.line
                key={`line-${idx}`}
                x1={`${nodeFrom.x}%`}
                y1={`${nodeFrom.y}%`}
                x2={`${nodeTO.x}%`}
                y2={`${nodeTO.y}%`}
                stroke="url(#goldMagentaGradient)"
                strokeWidth="0.5"
                strokeOpacity="0.3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{
                  duration: 2,
                  delay: idx * 0.1,
                  ease: "easeOut",
                }}
              />
            );
          })}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="goldMagentaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          
          {/* Node circles */}
          {CONSTELLATION_NODES.map((node, idx) => (
            <motion.circle
              key={`node-${idx}`}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r="3"
              fill="#d4af37"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{
                duration: 0.5,
                delay: 0.5 + idx * 0.1,
                type: "spring",
              }}
            />
          ))}
        </svg>

        {/* Ambient glow orbs */}
        <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-[#d4af37]/5 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-[#e11d48]/5 blur-[120px] [animation-delay:2s]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Glassmorphism card with Gold-to-Magenta gradient border */}
          <div className="relative rounded-2xl p-[1px] shadow-2xl">
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#d4af37] via-[#d4af37]/50 to-[#e11d48] opacity-60" />
            
            {/* Card content */}
            <div className="relative rounded-2xl bg-[#0a1229]/90 p-8 backdrop-blur-xl">
              <div className="space-y-6">
                {/* Trust Badge */}
                {showTrustBadge && <AuthTrustBadge />}

                {/* Header */}
                <div className="space-y-2 text-center">
                  <h1 className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-3xl">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-sm text-[#f5f5dc]/60">{description}</p>
                  )}
                </div>

                {/* Form content */}
                <div>{children}</div>

                {/* 7-Product Grid */}
                {showPillarGrid && <PillarGrid />}

                {/* Legal disclaimer */}
                <div className="space-y-3 border-t border-[#d4af37]/20 pt-4 text-center text-[10px] leading-relaxed text-[#f5f5dc]/40">
                  <p>
                    {disclaimerLine1}
                    <br />
                    {disclaimerLine2}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href="/policies/privacy-policy"
                      className="text-[#f5f5dc]/60 underline transition-colors hover:text-[#d4af37]"
                    >
                      Privacy Policy
                    </Link>
                    <span className="text-[#f5f5dc]/30">•</span>
                    <Link
                      href="/policies/terms-of-service"
                      className="text-[#f5f5dc]/60 underline transition-colors hover:text-[#d4af37]"
                    >
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {footer && (
            <div className="mt-6 text-center text-sm text-[#f5f5dc]/50">{footer}</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
