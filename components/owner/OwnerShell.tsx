"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  ActivitySquare,
  Building2,
  HeartPulse,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OwnerShellProps = {
  children: ReactNode;
  actorEmail?: string | null;
  actorRole?: string | null;
};

const NAV_ITEMS = [
  { label: "Platform Admin", href: "/ops/platform-admin", icon: LayoutDashboard },
  { label: "Workspaces", href: "/ops/workspaces", icon: Building2 },
  { label: "Audit", href: "/ops/audit", icon: ScrollText },
  { label: "Health", href: "/ops/health", icon: HeartPulse },
];

export function OwnerShell({ children, actorEmail, actorRole }: OwnerShellProps) {
  const t = useTranslations("opsUI");
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/80 px-4 py-4 shadow-sm backdrop-blur">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Platform Admin / Internal Ops
            </p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-foreground" />
              <h1 className="text-xl font-semibold leading-tight">{t("owner.shell.title")}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("owner.shell.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted/70 px-4 py-3 text-xs text-muted-foreground">
            <ActivitySquare className="h-4 w-4 text-foreground" />
            <div className="flex flex-col">
              <span className="text-foreground">{actorEmail ?? "owner"}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {(actorRole ?? "owner").toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/ops/platform-admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
                  active
                    ? "border-ring bg-ring/10 text-foreground shadow-sm"
                    : "border-border bg-card/80 text-muted-foreground hover:border-ring hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main id="main-content" className="mb-10 space-y-6">{children}</main>
      </div>
    </div>
  );
}
