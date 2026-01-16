"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Sparkles,
  Coins,
  Bell,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

export type AppNavLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

// Icon map for default labels
const iconMap: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Modules: Boxes,
  Helper: Sparkles,
  Tokens: Coins,
  Notifications: Bell,
  Billing: CreditCard,
  Settings: Settings,
};

export default function AppNavLinks({ links }: { links: AppNavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5 text-sm">
      {links.map((link) => {
        const isActive = pathname ? pathname.startsWith(link.href) : false;
        const Icon = link.icon ?? iconMap[link.label] ?? LayoutDashboard;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className="group relative"
          >
            <motion.div
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70 ${
                isActive
                  ? "bg-[#d4af37]/10 text-[#f5f5dc]"
                  : "text-[#f5f5dc]/60 hover:bg-[#d4af37]/5 hover:text-[#f5f5dc]"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Magenta glow indicator on left edge - Active state */}
              <span
                aria-hidden
                className={`absolute inset-y-1 left-0 w-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-[#e11d48] shadow-[0_0_8px_rgba(225,29,72,0.6)]"
                    : "bg-transparent group-hover:bg-[#d4af37]/40"
                }`}
              />
              {/* Icon */}
              <Icon
                className={`h-[18px] w-[18px] transition-colors ${
                  isActive ? "text-[#d4af37]" : "text-[#f5f5dc]/60 group-hover:text-[#d4af37]"
                }`}
              />
              {/* Label */}
              <span className="font-medium">{link.label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
