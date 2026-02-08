"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { products } from "@/lib/products";
import { trackCta } from "@/lib/analytics";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

type NavItem = {
  href: string;
  label: string;
  highlight?: boolean;
  badge?: string;
};

type NavbarProps = {
  variant?: "default" | "marketing";
};

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/status", label: "Status" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/policies", label: "Policies" },
  { href: "/pricing", label: "Pricing" },
];

const productNavOrder = [
  "platform",
  "meta-hub",
  "helper",
  "studio",
  "apps",
  "marketplace",
  "arena",
  "pay",
  "community",
  "trade",
];

const productNav: NavItem[] = [
  { href: "/products", label: "Overview" },
  ...productNavOrder.map((slug) => {
    const product = products.find((item) => item.slug === slug);
    return {
      href: `/products/${slug}`,
      label: product?.name ?? slug,
    };
  }),
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [productsMobileOpen, setProductsMobileOpen] = useState(false);

  const isMarketing = variant === "marketing";

  const closeMenu = () => {
    setOpen(false);
    setProductsOpen(false);
    setProductsMobileOpen(false);
  };

  const headerClass = isMarketing
    ? "sticky top-0 z-40 border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] backdrop-blur"
    : "sticky top-0 z-30 border-b border-slate-800/60 bg-gigaviz-bg/80 backdrop-blur";

  const navTextClass = isMarketing ? "text-[color:var(--gv-muted)]" : "text-slate-300";
  const navHoverClass = isMarketing ? "hover:text-[color:var(--gv-accent)]" : "hover:text-cyan-300";
  const activeClass = isMarketing ? "text-[color:var(--gv-accent)]" : "text-cyan-300";
  const taglineClass = isMarketing ? "text-[color:var(--gv-muted)]" : "text-slate-400";

  const ctaGhost = isMarketing
    ? "border border-[color:var(--gv-border)] bg-transparent text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
    : "border border-slate-700/70 bg-transparent text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200";

  const ctaPrimary = isMarketing
    ? "bg-[color:var(--gv-accent)] text-slate-900 hover:bg-[color:var(--gv-cream)]"
    : "bg-cyan-400 text-slate-900 hover:bg-cyan-300";

  return (
    <header className={headerClass}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center" onClick={closeMenu}>
          <div className="flex flex-col items-start">
            <Image
              src="/brand/gigaviz-logo-horizontal.png"
              alt="Gigaviz"
              width={180}
              height={40}
              className="hidden h-7 w-auto md:block"
              priority
            />
            <Image
              src="/brand/gigaviz-mark.png"
              alt="Gigaviz"
              width={36}
              height={36}
              className="block h-8 w-8 md:hidden"
              priority
            />
            <span className={`mt-1 hidden text-[11px] md:block ${taglineClass}`}>
              Unified Digital Ecosystem
            </span>
          </div>
        </Link>

        <nav className={`hidden items-center gap-6 text-sm md:flex ${navTextClass}`}>
          {navItems.slice(0, 1).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={["relative transition", navHoverClass, active ? activeClass : ""].join(
                  " "
                )}
              >
                {item.label}
                {active ? (
                  <span
                    className={
                      isMarketing
                        ? "absolute -bottom-2 left-0 h-[2px] w-full rounded bg-[color:var(--gv-accent)]"
                        : "absolute -bottom-2 left-0 h-[2px] w-full rounded bg-cyan-300/70"
                    }
                  />
                ) : null}
              </Link>
            );
          })}

          <div
            className="relative"
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              type="button"
              className={[
                "inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm transition",
                navHoverClass,
                productsOpen ? activeClass : "",
              ].join(" ")}
              aria-expanded={productsOpen}
              aria-controls="products-menu"
              onClick={() => setProductsOpen((value) => !value)}
              onMouseEnter={() => setProductsOpen(true)}
            >
              Products
              <span className="text-xs">+</span>
            </button>

            <div
              id="products-menu"
              className={[
                "absolute right-0 mt-3 w-[360px] rounded-3xl border p-4 shadow-xl transition",
                isMarketing
                  ? "border-[color:var(--gv-border)] bg-[color:var(--gv-surface)] text-[color:var(--gv-text)]"
                  : "border-slate-800 bg-slate-950/95 text-slate-200",
                productsOpen ? "opacity-100" : "pointer-events-none opacity-0",
              ].join(" ")}
            >
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Gigaviz Ecosystem
              </div>
              <div className="mt-3 grid gap-2">
                {productNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isMarketing
                        ? "rounded-2xl border border-transparent bg-[color:var(--gv-card-soft)] px-3 py-2 text-sm text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                        : "rounded-2xl border border-transparent bg-white/5 px-3 py-2 text-sm text-slate-200 hover:border-cyan-400/40"
                    }
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {navItems.slice(1).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={["relative transition", navHoverClass, active ? activeClass : ""].join(
                  " "
                )}
              >
                {item.label}
                {active ? (
                  <span
                    className={
                      isMarketing
                        ? "absolute -bottom-2 left-0 h-[2px] w-full rounded bg-[color:var(--gv-accent)]"
                        : "absolute -bottom-2 left-0 h-[2px] w-full rounded bg-cyan-300/70"
                    }
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          {isMarketing ? (
            <>
              <Link
                href="/dashboard"
                className={`rounded-2xl px-3 py-1.5 text-xs font-medium ${ctaGhost}`}
                onClick={() => trackCta("Sign In", "navbar", "/dashboard")}
              >
                Sign In
              </Link>
              <Link
                href="/get-started"
                className={`rounded-2xl px-3 py-1.5 text-xs font-semibold shadow-sm ${ctaPrimary}`}
                onClick={() => trackCta("Get Started", "navbar", "/get-started")}
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className={`rounded-2xl px-3 py-1.5 text-xs font-medium ${ctaGhost}`}
                onClick={() => trackCta("View Plans", "navbar", "/pricing")}
              >
                View Plans
              </Link>
              <Link
                href="/get-started"
                className={`rounded-2xl px-3 py-1.5 text-xs font-semibold shadow-sm ${ctaPrimary}`}
                onClick={() => trackCta("Get Started", "navbar", "/get-started")}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={
            isMarketing
              ? "inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] bg-transparent px-3 py-2 text-xs font-medium text-[color:var(--gv-text)] md:hidden"
              : "inline-flex items-center justify-center rounded-2xl border border-slate-700/70 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400/60 md:hidden"
          }
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div
          className={
            isMarketing
              ? "md:hidden border-t border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]"
              : "md:hidden border-t border-slate-800/60 bg-gigaviz-bg/95 backdrop-blur"
          }
        >
          <div className="container py-4">
            <div className="grid gap-2">
              {navItems.slice(0, 1).map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center justify-between rounded-2xl px-4 py-3 text-sm",
                      isMarketing
                        ? "bg-[color:var(--gv-card-soft)] text-[color:var(--gv-text)]"
                        : "bg-white/5 text-slate-200 hover:bg-white/10",
                      active
                        ? isMarketing
                          ? "ring-1 ring-[color:var(--gv-accent)]"
                          : "ring-1 ring-cyan-400/40"
                        : "",
                    ].join(" ")}
                    onClick={closeMenu}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className={isMarketing ? "text-[color:var(--gv-muted)]" : "text-slate-400"}>
                      +
                    </span>
                  </Link>
                );
              })}

              <button
                type="button"
                className={
                  isMarketing
                    ? "flex items-center justify-between rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3 text-sm text-[color:var(--gv-text)]"
                    : "flex items-center justify-between rounded-2xl border border-slate-800 bg-white/5 px-4 py-3 text-sm text-slate-200"
                }
                aria-expanded={productsMobileOpen}
                onClick={() => setProductsMobileOpen((value) => !value)}
              >
                <span className="font-medium">Products</span>
                <span className={isMarketing ? "text-[color:var(--gv-muted)]" : "text-slate-400"}>
                  {productsMobileOpen ? "-" : "+"}
                </span>
              </button>

              {productsMobileOpen ? (
                <div className="grid gap-2">
                  {productNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        isMarketing
                          ? "rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface)] px-4 py-3 text-sm text-[color:var(--gv-text)]"
                          : "rounded-2xl border border-slate-800 bg-white/5 px-4 py-3 text-sm text-slate-200"
                      }
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}

              {navItems.slice(1).map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center justify-between rounded-2xl px-4 py-3 text-sm",
                      isMarketing
                        ? "bg-[color:var(--gv-card-soft)] text-[color:var(--gv-text)]"
                        : "bg-white/5 text-slate-200 hover:bg-white/10",
                      active
                        ? isMarketing
                          ? "ring-1 ring-[color:var(--gv-accent)]"
                          : "ring-1 ring-cyan-400/40"
                        : "",
                    ].join(" ")}
                    onClick={closeMenu}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className={isMarketing ? "text-[color:var(--gv-muted)]" : "text-slate-400"}>
                      +
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {isMarketing ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${ctaGhost}`}
                    onClick={() => {
                      trackCta("Sign In", "navbar", "/dashboard");
                      closeMenu();
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/get-started"
                    className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${ctaPrimary}`}
                    onClick={() => {
                      trackCta("Get Started", "navbar", "/get-started");
                      closeMenu();
                    }}
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/pricing"
                    className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${ctaGhost}`}
                    onClick={() => {
                      trackCta("View Plans", "navbar", "/pricing");
                      closeMenu();
                    }}
                  >
                    View Plans
                  </Link>
                  <Link
                    href="/get-started"
                    className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${ctaPrimary}`}
                    onClick={() => {
                      trackCta("Get Started", "navbar", "/get-started");
                      closeMenu();
                    }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <div className={
              isMarketing
                ? "mt-3 text-center text-xs text-[color:var(--gv-muted)]"
                : "mt-3 text-center text-xs text-slate-400"
            }>
              One account, one dashboard for the entire Gigaviz ecosystem.
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
