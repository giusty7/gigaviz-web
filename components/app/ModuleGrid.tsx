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
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{module.name}</h3>
              <p className="text-sm text-white/60 mt-1">{module.description}</p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-wide ${
                module.status === "available"
                  ? "bg-emerald-500/10 text-emerald-200"
                  : module.status === "locked"
                  ? "bg-amber-500/10 text-amber-200"
                  : "bg-white/10 text-white/70"
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
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
              >
                Open module
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => handleUnavailable(module.status)}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
              >
                {module.status === "locked" ? "Locked" : "Coming soon"}
              </button>
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
