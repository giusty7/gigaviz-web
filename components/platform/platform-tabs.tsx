"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Home,
  KeyRound,
  ScrollText,
  Shield,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PlatformTabsProps = {
  baseHref: string;
};

const tabs = [
  { label: "Overview", segment: "", icon: Home },
  { label: "Workspaces", segment: "/workspaces", icon: Users2 },
  { label: "Roles & Access", segment: "/roles", icon: KeyRound },
  { label: "Audit Log", segment: "/audit", icon: ScrollText },
  { label: "Billing", segment: "/billing", icon: CreditCard },
  { label: "Entitlements", segment: "/entitlements", icon: Shield },
];

export function PlatformTabs({ baseHref }: PlatformTabsProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-16 z-20 -mx-1 rounded-2xl border border-border/70 bg-gigaviz-surface/80 px-2 py-2 shadow-lg shadow-black/10 backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const href = `${baseHref}${tab.segment}`;
          const active =
            href === baseHref
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.segment || "overview"}
              href={href}
              className={cn(
                "group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition duration-150",
                active
                  ? "border-gigaviz-gold bg-gigaviz-gold/15 text-foreground shadow-sm ring-1 ring-gigaviz-gold/60"
                  : "border-border/80 bg-card/70 text-muted-foreground hover:border-gigaviz-gold/70 hover:text-foreground"
              )}
            >
              <span className={cn("flex h-5 w-5 items-center justify-center", active ? "text-foreground" : "text-muted-foreground") }>
                <Icon size={16} strokeWidth={2} />
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
