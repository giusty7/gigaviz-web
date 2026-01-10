"use client";

import Link from "next/link";
import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

export type ModuleStatus = "available" | "preview" | "coming_soon";

type ModuleItem = {
  key: string;
  name: string;
  description: string;
  status: ModuleStatus;
  href?: string;
  previewLabel?: string;
};

type ModuleGridProps = {
  modules: ModuleItem[];
};

export default function ModuleGrid({ modules }: ModuleGridProps) {
  const handleUnavailable = useCallback((status: ModuleStatus) => {
    toast({
      title: status === "preview" ? "Mode preview" : "Coming soon",
      description:
        status === "preview"
          ? "Kamu bisa melihat tampilan, aksi akan meminta upgrade."
          : "Modul ini masih dalam tahap persiapan.",
    });
  }, []);

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
                  : module.status === "preview"
                  ? "bg-amber-500/15 text-amber-200"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {module.status === "available"
                ? "Available"
                : module.status === "preview"
                ? "Preview"
                : "Coming soon"}
            </span>
          </div>

          <div className="mt-4">
            {module.href ? (
              <Link
                href={module.href}
                onClick={() => module.status !== "available" && handleUnavailable(module.status)}
                className="inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-xs font-semibold text-foreground hover:border-gigaviz-gold"
              >
                {module.status === "preview" ? "Open preview" : "Open module"}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => handleUnavailable(module.status)}
                className="inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-xs font-semibold text-foreground hover:border-gigaviz-gold"
              >
                {module.status === "coming_soon" ? "Coming soon" : "Preview"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
