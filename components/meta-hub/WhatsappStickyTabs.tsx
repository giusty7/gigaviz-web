"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Templates", slug: "" },
  { label: "Inbox", slug: "/inbox" },
  { label: "Contacts", slug: "/contacts" },
  { label: "Outbox", slug: "/outbox" },
  { label: "Jobs", slug: "/jobs" },
  { label: "Webhooks", slug: "/webhooks" },
];

export function WhatsappStickyTabs({ basePath }: { basePath: string }) {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border border-border bg-card/80 px-2 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const href = `${basePath}${tab.slug}`;
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[96px] items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition",
                active
                  ? "bg-gigaviz-surface text-foreground border border-border"
                  : "text-muted-foreground hover:bg-gigaviz-surface/60"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
