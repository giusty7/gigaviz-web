"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import type { MetaHubFlags } from "@/lib/meta-hub/config";

type NavItem = {
  label: string;
  href: string;
  status: "live" | "beta" | "soon";
  children?: NavItem[];
};

function buildNav(flags: MetaHubFlags, base: string): NavItem[] {
  return [
    { label: "Overview", href: `${base}`, status: "live" },
    { label: "Connections", href: `${base}/connections`, status: "live" },
    { label: "Webhooks", href: `${base}/webhooks`, status: "live" },
    { label: "AI Auto-Reply", href: `${base}/ai-reply`, status: "live" },
    {
      label: "Messaging - WhatsApp",
      href: `${base}/messaging/whatsapp`,
      status: flags.waEnabled ? "live" : "beta",
      children: [
        { label: "Templates", href: `${base}/messaging/whatsapp`, status: "live" },
        { label: "Contacts", href: `${base}/messaging/whatsapp/contacts`, status: "live" },
        { label: "Inbox", href: `${base}/messaging/whatsapp/inbox`, status: "live" },
      ],
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
        const hasChildren = item.children && item.children.length > 0;
        return (
          <div key={item.href} className="space-y-1">
            <Link
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
            {hasChildren ? (
              <div className="pl-4">
                {item.children!.map((child) => {
                  const childActive =
                    pathname === child.href || pathname?.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                        childActive
                          ? "bg-gigaviz-surface text-foreground border border-border"
                          : "hover:bg-gigaviz-surface"
                      }`}
                    >
                      <span className="mr-2">{child.label}</span>
                      <MetaHubBadge status={child.status} />
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
