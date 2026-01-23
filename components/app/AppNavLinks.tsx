"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Sparkles,
  Coins,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type AppNavLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

// Icon map for default labels
const iconMap: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Products: Boxes,
  "AI Assistant": Sparkles,
  "Usage Credits": Coins,
  Subscription: CreditCard,
  Settings: Settings,
};

type AppNavLinksProps = {
  links: AppNavLink[];
  collapsed?: boolean;
};

export default function AppNavLinks({ links, collapsed = false }: AppNavLinksProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={150}>
      <nav className={cn("flex flex-col gap-1 text-sm", collapsed && "items-center w-full")}>
        {links.map((link) => {
          const isActive = pathname ? pathname.startsWith(link.href) : false;
          const Icon = link.icon ?? iconMap[link.label] ?? LayoutDashboard;

          const content = (
            <motion.div
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70",
                collapsed
                  ? "h-10 w-10 justify-center"
                  : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-[#d4af37]/10 text-[#f5f5dc]"
                  : "text-[#f5f5dc]/60 hover:bg-[#d4af37]/5 hover:text-[#f5f5dc]"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Magenta glow indicator on left edge - Active state */}
              {!collapsed && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-1 left-0 w-1 rounded-full transition-all duration-300",
                    isActive
                      ? "bg-[#e11d48] shadow-[0_0_8px_rgba(225,29,72,0.6)]"
                      : "bg-transparent group-hover:bg-[#d4af37]/40"
                  )}
                />
              )}
              {/* Icon */}
              <Icon
                className={cn(
                  "shrink-0 transition-colors",
                  collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                  isActive ? "text-[#d4af37]" : "text-[#f5f5dc]/60 group-hover:text-[#d4af37]"
                )}
              />
              {/* Label */}
              {!collapsed && <span className="font-medium">{link.label}</span>}
            </motion.div>
          );

          if (collapsed) {
            return (
              <Tooltip key={link.href} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    aria-label={link.label}
                    aria-current={isActive ? "page" : undefined}
                    className="group relative"
                  >
                    {content}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {link.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className="group relative"
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
