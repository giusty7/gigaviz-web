import Link from "next/link";

type ModuleItem = {
  key: string;
  name: string;
  description: string;
  href: string;
  locked: boolean;
};

type ModuleGridProps = {
  modules: ModuleItem[];
};

export default function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <div
          key={module.key}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{module.name}</h3>
              <p className="text-sm text-white/60 mt-1">{module.description}</p>
            </div>
            <span className="text-xs text-white/40">Module</span>
          </div>

          <div className="mt-4">
            {module.locked ? (
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Locked. Upgrade to unlock.
              </div>
            ) : (
              <Link
                href={module.href}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
              >
                Open module
              </Link>
            )}
          </div>

          {module.locked && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
          )}
        </div>
      ))}
    </div>
  );
}
