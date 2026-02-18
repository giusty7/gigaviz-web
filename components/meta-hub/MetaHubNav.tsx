"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import type { MetaHubFlags } from "@/lib/meta-hub/config";

type NavItem = {
  labelKey: string;
  href: string;
  status: "live" | "beta" | "soon";
  children?: NavItem[];
};

function buildNav(flags: MetaHubFlags, base: string): NavItem[] {
  return [
    { labelKey: "overview", href: `${base}`, status: "live" },
    { labelKey: "connections", href: `${base}/connections`, status: "live" },
    { labelKey: "webhooks", href: `${base}/webhooks`, status: "live" },
    { labelKey: "aiAutoReply", href: `${base}/ai-reply`, status: "live" },
    {
      labelKey: "messagingWhatsApp",
      href: `${base}/messaging/whatsapp`,
      status: flags.waEnabled ? "live" : "beta",
      children: [
        { labelKey: "templates", href: `${base}/messaging/whatsapp`, status: "live" },
        { labelKey: "contacts", href: `${base}/messaging/whatsapp/contacts`, status: "live" },
        { labelKey: "inbox", href: `${base}/messaging/whatsapp/inbox`, status: "live" },
      ],
    },
    {
      labelKey: "messagingInstagram",
      href: `${base}/messaging/instagram`,
      status: flags.igEnabled ? "live" : "soon",
    },
    {
      labelKey: "messagingMessenger",
      href: `${base}/messaging/messenger`,
      status: flags.msEnabled ? "beta" : "soon",
    },
    { labelKey: "ads", href: `${base}/ads`, status: flags.adsEnabled ? "beta" : "soon" },
    {
      labelKey: "insights",
      href: `${base}/insights`,
      status: flags.insightsEnabled ? "beta" : "soon",
    },
  ];
}

export function MetaHubNav({ basePath, flags }: { basePath: string; flags: MetaHubFlags }) {
  const pathname = usePathname();
  const t = useTranslations("metaHubUI.nav");
  const items = buildNav(flags, basePath);

  return (
    <nav aria-label="Meta Hub navigation" className="space-y-1 text-sm text-muted-foreground">
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
              <span className="mr-2">{t(item.labelKey)}</span>
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
                      <span className="mr-2">{t(child.labelKey)}</span>
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
