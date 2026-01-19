"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ActivitySquare,
  Building2,
  HeartPulse,
  LayoutPanelLeft,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OpsShellProps = {
  children: ReactNode;
  actorEmail?: string | null;
  actorRole?: string | null;
};

const NAV_ITEMS = [
  { label: "Workspaces", href: "/ops/workspaces", icon: Building2 },
  { label: "System Logs", href: "/ops/audit", icon: ScrollText },
  { label: "Health", href: "/ops/health", icon: HeartPulse },
  { label: "Sovereign Command", href: "/ops/god-console", icon: LayoutPanelLeft },
];

export function OpsShell({ children, actorEmail, actorRole }: OpsShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#040815] via-[#050a18] to-[#0a1229] text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-100">
        <div className="batik-overlay opacity-100" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Ctext x='30' y='140' font-family='Inter' font-size='34' fill='rgba(212,175,55,0.06)' transform='rotate(-30 140 140)'%3EINTERNAL ACCESS%3C/text%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "280px 280px",
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d4af37]/40 bg-[#050a18]/80 px-4 py-4 shadow-sm backdrop-blur">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
              Imperium Internal Ops
            </p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#d4af37]" />
              <h1 className="text-xl font-semibold leading-tight text-[#f5f5dc]">
                Ops Console
              </h1>
            </div>
            <p className="text-sm text-[#f5f5dc]/70">
              Sovereign control for workspaces, billing, plans, logs, and manual overrides.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/70 px-4 py-3 text-xs text-[#f5f5dc]/80 backdrop-blur">
            <ActivitySquare className="h-4 w-4 text-[#d4af37]" />
            <div className="flex flex-col">
              <span className="text-[#f5f5dc]">{actorEmail ?? "platform-admin"}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {(actorRole ?? "platform_admin").toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/ops/god-console" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition backdrop-blur",
                  active
                    ? "border-[#d4af37]/80 bg-[#d4af37]/15 text-[#f5f5dc] shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                    : "border-border bg-[#050a18]/80 text-[#f5f5dc]/60 hover:border-[#d4af37]/60 hover:text-[#f5f5dc]"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mb-10 space-y-6 rounded-2xl border border-[#d4af37]/25 bg-[#050a18]/60 p-4 backdrop-blur-lg shadow-[0_30px_80px_-50px_rgba(0,0,0,0.7)]">
          {children}
        </main>
      </div>
    </div>
  );
}
