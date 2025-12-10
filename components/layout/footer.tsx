export function Footer() {
  return (
    <footer className="border-t border-slate-800/60">
      <div className="container flex flex-col gap-2 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Gigaviz · Glorious Victorious.</p>
        <p className="text-slate-500">
          Dibangun dengan Next.js, Tailwind, dan kopi yang cukup.
        </p>
      </div>
    </footer>
  );
}
