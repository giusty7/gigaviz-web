"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="container h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Gigaviz
        </Link>
        <nav
          role="navigation"
          className="hidden md:flex items-center gap-6 text-sm"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                pathname === l.href && "text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Button asChild className="rounded-xl" aria-label="Hubungi kami">
          <Link href="/contact">Hubungi</Link>
        </Button>
      </div>
    </header>
  );
}
