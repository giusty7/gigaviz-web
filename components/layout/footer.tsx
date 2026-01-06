import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/60">
      <div className="container flex flex-col gap-4 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p>(c) {new Date().getFullYear()} Gigaviz - Glorious Victorious.</p>
          <p className="text-slate-500">
            Dibangun dengan Next.js, Tailwind, dan kopi yang cukup.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-slate-400">
          <Link href="/media-kit" className="hover:text-slate-200">
            Media Kit
          </Link>
        </nav>
      </div>
    </footer>
  );
}
