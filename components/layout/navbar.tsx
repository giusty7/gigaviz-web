"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  highlight?: boolean; // untuk menu yang mau ditonjolkan
  badge?: string; // misal "New"
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Beranda" },
      { href: "/about", label: "Tentang" },
      { href: "/products", label: "Produk" },
      { href: "/wa-platform", label: "WA Platform", highlight: true, badge: "NEW" },
      { href: "/pricing", label: "Pricing" },
      { href: "/blog", label: "Blog" },
    ],
    []
  );

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-gigaviz-bg/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-400/40">
            <span className="text-xs font-bold tracking-widest text-cyan-300">GV</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-slate-100">
              Gigaviz
            </div>
            <div className="hidden text-[11px] text-slate-400 md:block">
              Ekosistem digital • Web • WA Platform
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "group relative inline-flex items-center gap-2 rounded-2xl px-3 py-1.5",
                    "bg-cyan-400/10 ring-1 ring-cyan-400/30",
                    "text-cyan-200 hover:text-cyan-100 hover:ring-cyan-400/50",
                    active ? "ring-cyan-400/70" : "",
                  ].join(" ")}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                      {item.badge}
                    </span>
                  ) : null}
                  <span className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-lg transition group-hover:opacity-30 bg-cyan-400/40" />
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative transition hover:text-cyan-300",
                  active ? "text-cyan-300" : "",
                ].join(" ")}
              >
                {item.label}
                {active ? (
                  <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded bg-cyan-300/70" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/pricing"
            className="rounded-2xl border border-slate-700/70 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
          >
            Lihat Paket
          </Link>
          <Link
            href="/wa-platform"
            className="rounded-2xl bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-cyan-300"
          >
            Request Demo
          </Link>
        </div>

        {/* Mobile Button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400/60 md:hidden"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Tutup" : "Menu"}
        </button>
      </div>

      {/* Mobile Menu */}
      {open ? (
        <div className="md:hidden border-t border-slate-800/60 bg-gigaviz-bg/95 backdrop-blur">
          <div className="container py-4">
            <div className="grid gap-2">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center justify-between rounded-2xl px-4 py-3 text-sm",
                      item.highlight
                        ? "bg-cyan-400/10 ring-1 ring-cyan-400/30 text-cyan-200"
                        : "bg-white/5 text-slate-200 hover:bg-white/10",
                      active ? "ring-1 ring-cyan-400/40" : "",
                    ].join(" ")}
                    onClick={closeMenu}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                        {item.badge}
                      </span>
                    ) : (
                      <span className="text-slate-400">→</span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/pricing"
                className="rounded-2xl border border-slate-700/70 bg-transparent px-4 py-3 text-center text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
                onClick={closeMenu}
              >
                Lihat Paket
              </Link>
              <Link
                href="/wa-platform"
                className="rounded-2xl bg-cyan-400 px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-cyan-300"
                onClick={closeMenu}
              >
                Request Demo
              </Link>
            </div>

            <div className="mt-3 text-center text-xs text-slate-400">
              Fokus utama: WhatsApp Cloud API (resmi) • Konsultasi gratis untuk kebutuhan bisnis.
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
