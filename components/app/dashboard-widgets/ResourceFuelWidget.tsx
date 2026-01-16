"use client";

import { motion } from "framer-motion";
import { Fuel, MessageSquare, Bot, Cloud } from "lucide-react";

type ResourceData = {
  name: string;
  icon: React.ReactNode;
  used: number;
  total: number;
  unit: string;
  gradient: { start: string; end: string };
};

const resources: ResourceData[] = [
  {
    name: "WA Quota",
    icon: <MessageSquare className="h-4 w-4" />,
    used: 847,
    total: 1000,
    unit: "msgs",
    gradient: { start: "#d4af37", end: "#f9d976" },
  },
  {
    name: "AI Tokens",
    icon: <Bot className="h-4 w-4" />,
    used: 12500,
    total: 50000,
    unit: "tokens",
    gradient: { start: "#e11d48", end: "#f43f5e" },
  },
  {
    name: "Cloud Storage",
    icon: <Cloud className="h-4 w-4" />,
    used: 2.4,
    total: 5,
    unit: "GB",
    gradient: { start: "#d4af37", end: "#e11d48" },
  },
];

function CircularProgress({
  percentage,
  gradient,
  size = 80,
  strokeWidth = 6,
}: {
  percentage: number;
  gradient: { start: string; end: string };
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const gradientId = `progress-${gradient.start.replace("#", "")}`;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradient.start} />
          <stop offset="100%" stopColor={gradient.end} />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(245, 245, 220, 0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 6px ${gradient.start}40)` }}
      />
    </svg>
  );
}

export function ResourceFuelWidget() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl">
      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(212, 175, 55, 0.04) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold text-[#f5f5dc]">Resource Fuel</h3>
        </div>

        <div className="mt-5 flex items-center justify-around gap-2">
          {resources.map((resource, index) => {
            const percentage = Math.round((resource.used / resource.total) * 100);
            return (
              <motion.div
                key={resource.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <CircularProgress percentage={percentage} gradient={resource.gradient} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-[90deg]">
                    <span className="text-[#f5f5dc]/60">{resource.icon}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-[#f5f5dc]">{resource.name}</p>
                  <p className="mt-0.5 text-[10px] text-[#f5f5dc]/50">
                    {resource.used.toLocaleString()}/{resource.total.toLocaleString()} {resource.unit}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
