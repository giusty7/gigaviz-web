"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AppNavLink = {
  href: string;
  label: string;
};

export default function AppNavLinks({ links }: { links: AppNavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 text-sm">
      {links.map((link) => {
        const isActive = pathname ? pathname.startsWith(link.href) : false;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`group relative flex items-center rounded-xl px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold/70 ${
              isActive ? "bg-gigaviz-surface text-foreground" : "text-foreground hover:bg-gigaviz-surface"
            }`}
          >
            <span
              aria-hidden
              className={`absolute inset-y-1 left-0 w-1 rounded-full transition ${
                isActive ? "bg-gigaviz-gold" : "bg-transparent group-hover:bg-gigaviz-gold/60"
              }`}
            />
            <span className="pl-2">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
