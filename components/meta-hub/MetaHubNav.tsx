"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import type { MetaHubFlags } from "@/lib/meta-hub/config";

type NavItem = {
  label: string;
  href: string;
  status: "live" | "beta" | "soon";
};

function buildNav(flags: MetaHubFlags, base: string): NavItem[] {
  return [
    { label: "Overview", href: `${base}`, status: "live" },
    { label: "Connections", href: `${base}/connections`, status: "live" },
    { label: "Webhooks", href: `${base}/webhooks`, status: "live" },
    {
      label: "Messaging - WhatsApp",
      href: `${base}/messaging/whatsapp`,
      status: flags.waEnabled ? "live" : "beta",
    },
    {
      label: "Messaging - Instagram",
      href: `${base}/messaging/instagram`,
      status: flags.igEnabled ? "live" : "soon",
    },
    {
      label: "Messaging - Messenger",
      href: `${base}/messaging/messenger`,
      status: flags.msEnabled ? "beta" : "soon",
    },
    { label: "Ads", href: `${base}/ads`, status: flags.adsEnabled ? "beta" : "soon" },
    {
      label: "Insights",
      href: `${base}/insights`,
      status: flags.insightsEnabled ? "beta" : "soon",
    },
  ];
}

export function MetaHubNav({ basePath, flags }: { basePath: string; flags: MetaHubFlags }) {
  const pathname = usePathname();
  const items = buildNav(flags, basePath);

  return (
    <nav className="space-y-1 text-sm text-muted-foreground">
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2 transition ${
              active
                ? "bg-gigaviz-surface text-foreground border border-border"
                : "hover:bg-gigaviz-surface"
            }`}
          >
            <span className="mr-2">{item.label}</span>
            <MetaHubBadge status={item.status} />
          </Link>
        );
      })}
    </nav>
  );
}
