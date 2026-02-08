import Link from "next/link";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--gv-border)]">
      <div className="container flex flex-col gap-4 py-6 text-xs text-[color:var(--gv-muted)] md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[color:var(--gv-text)]">(c)2026 Gigaviz &mdash; Glorious Victorious.</p>
          <p>Built with Next.js, Tailwind, and a healthy amount of coffee.</p>
          <p>Built in Indonesia. Designed for global scale.</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <LocaleSwitcher />
          <nav className="flex flex-wrap gap-4 text-[color:var(--gv-muted)] md:justify-end">
            <Link href="/contact" className="transition-colors hover:text-[color:var(--gv-text)]">
              Contact
            </Link>
            <Link href="/media-kit" className="transition-colors hover:text-[color:var(--gv-text)]">
              Media Kit
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
