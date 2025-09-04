"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur">
      <div className="container h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">Gigaviz</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-white/70 hover:text-white transition",
                pathname === l.href && "text-white"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="rounded-2xl bg-brand text-brand-foreground hover:opacity-90">
          <a href="mailto:hello@gigaviz.com">Hubungi</a>
        </Button>
      </div>
    </header>
  );
}
