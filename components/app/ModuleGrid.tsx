"use client";

import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

export type ModuleStatus = "available" | "locked" | "coming_soon";

type ModuleItem = {
  key: string;
  name: string;
  description: string;
  status: ModuleStatus;
  href?: string;
  lockedHref?: string;
  lockedLabel?: string;
};

type ModuleGridProps = {
  modules: ModuleItem[];
};

export default function ModuleGrid({ modules }: ModuleGridProps) {
  const handleUnavailable = (status: ModuleStatus) => {
    toast({
      title: "Belum tersedia / Coming soon",
      description:
        status === "locked"
          ? "Fitur ini terkunci untuk plan aktif saat ini."
          : "Modul ini masih dalam tahap persiapan.",
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <div
          key={module.key}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-md shadow-black/20"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{module.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-wide ${
                module.status === "available"
                  ? "bg-emerald-500/15 text-emerald-200"
                  : module.status === "locked"
                  ? "bg-amber-500/15 text-amber-200"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {module.status === "available"
                ? "Available"
                : module.status === "locked"
                ? "Locked"
                : "Coming soon"}
            </span>
          </div>

          <div className="mt-4">
            {module.status === "available" && module.href ? (
              <Link
                href={module.href}
                className="inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-xs font-semibold text-foreground hover:border-gigaviz-gold"
              >
                Open module
              </Link>
            ) : (
              <>
                {module.status === "locked" && module.lockedHref ? (
                  <Link
                    href={module.lockedHref}
                    className="inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-xs font-semibold text-foreground hover:border-gigaviz-gold"
                  >
                    {module.lockedLabel ?? "Unlock"}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUnavailable(module.status)}
                    className="inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-xs font-semibold text-foreground hover:border-gigaviz-gold"
                  >
                    {module.status === "locked" ? "Locked" : "Coming soon"}
                  </button>
                )}
              </>
            )}
          </div>

          {module.status !== "available" && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/45" />
          )}
        </div>
      ))}
    </div>
  );
}
