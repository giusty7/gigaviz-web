"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type PlatformTabsProps = {
  baseHref: string;
};

const tabs = [
  { label: "Overview", segment: "" },
  { label: "Workspaces", segment: "/workspaces" },
  { label: "Roles & Access", segment: "/rbac" },
  { label: "Audit Log", segment: "/audit" },
  { label: "Billing", segment: "/billing" },
];

export function PlatformTabs({ baseHref }: PlatformTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href = `${baseHref}${tab.segment}`;
        const active = pathname === href || (tab.segment === "" && pathname === `${baseHref}`);
        return (
          <Link
            key={tab.segment || "overview"}
            href={href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              active
                ? "border-gigaviz-gold bg-gigaviz-gold/10 text-foreground"
                : "border-border text-muted-foreground hover:border-gigaviz-gold hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
