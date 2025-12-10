"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/about", label: "Tentang" },
  { href: "/products", label: "Produk" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-gigaviz-bg/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-400/40" />
          <span className="text-sm font-semibold tracking-wide">
            Gigaviz
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition hover:text-cyan-300 ${
                  active ? "text-cyan-300" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/contact"
          className="hidden rounded-2xl bg-cyan-400 px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-cyan-300 md:inline-flex"
        >
          Kontak
        </Link>
      </div>
    </header>
  );
}
