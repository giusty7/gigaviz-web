"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export type ModuleStatus = "available" | "locked" | "coming_soon" | "setup_required";

export type ModuleItem = {
  key: string;
  slug?: string;
  name: string;
  description: string;
  status: ModuleStatus;
  href?: string;
  accessLabel?: string;
  previewHref?: string;
  previewLabel?: string;
  notifyLabel?: string;
  comingSoonLabel?: string;
  planId?: string | null;
};

type ModuleGridProps = {
  modules: ModuleItem[];
  onUnlock?: (module: ModuleItem) => void;
  onSetup?: (module: ModuleItem) => void;
  onNotify?: (module: ModuleItem) => void;
};

export default function ModuleGrid({ modules, onUnlock, onSetup, onNotify }: ModuleGridProps) {
  const router = useRouter();

  const handleUnavailable = useCallback(
    (status: ModuleStatus, module: ModuleItem) => {
      if (status === "locked" && onUnlock) {
        onUnlock(module);
        return;
      }

      if (status === "setup_required" && onSetup) {
        onSetup(module);
        return;
      }

      if (status === "coming_soon") {
        toast({
          title: "Coming soon",
          description: "This module is being prepared. Track updates from the roadmap.",
        });
        return;
      }

      if (status === "locked") {
        toast({
          title: "Locked",
          description: "Upgrade or request access to unlock this module.",
        });
        return;
      }

      toast({
        title: "Setup required",
        description: "Complete the configuration before opening this module.",
      });
    },
    [onSetup, onUnlock]
  );

  const statusLabel: Record<ModuleStatus, string> = {
    available: "AVAILABLE",
    locked: "LOCKED",
    coming_soon: "COMING SOON",
    setup_required: "SETUP REQUIRED",
  };

  const statusClass: Record<ModuleStatus, string> = {
    available: "bg-emerald-400/20 text-emerald-50 border border-emerald-200/60",
    locked: "bg-amber-500/20 text-amber-50 border border-amber-200/70",
    coming_soon: "bg-amber-50 text-slate-900 border border-amber-200",
    setup_required: "bg-sky-400/20 text-sky-50 border border-sky-200/70",
  };

  const hoverClass =
    "transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-200/20 motion-reduce:transform-none";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <div
          key={module.key}
          className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-md shadow-black/20 focus-within:ring-2 focus-within:ring-gigaviz-gold/60 focus-within:ring-offset-2 focus-within:ring-offset-background ${hoverClass}`}
          onClick={() => {
            if (module.status === "coming_soon" && module.previewHref) {
              router.push(module.previewHref);
            }
          }}
          {...(module.status === "coming_soon" && module.previewHref ? { role: "button" } : {})}
          tabIndex={module.status === "coming_soon" && module.previewHref ? 0 : -1}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{module.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
              {module.accessLabel && (
                <p className="mt-1 text-xs text-muted-foreground">{module.accessLabel}</p>
              )}
            </div>
            <span
              className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-wide ${statusClass[module.status]}`}
            >
              {statusLabel[module.status] ?? "STATUS"}
            </span>
          </div>

          <div className="mt-4">
            {module.status === "available" && module.href ? (
              <Link
                href={module.href}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-xs font-semibold text-foreground hover:border-gigaviz-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold/70"
              >
                Open
              </Link>
            ) : module.status === "coming_soon" ? (
              <div className="inline-flex items-center gap-2">
                {module.previewHref ? (
                  <Link
                    href={module.previewHref}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center rounded-xl bg-gigaviz-gold px-3 py-2 text-xs font-semibold text-gigaviz-bg shadow hover:bg-gigaviz-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold/70"
                  >
                    {module.previewLabel ?? "Preview"}
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-disabled
                    className="inline-flex cursor-not-allowed items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    {module.comingSoonLabel ?? "Coming soon"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotify?.(module);
                  }}
                  className="text-xs font-semibold text-gigaviz-gold hover:underline"
                >
                  {module.notifyLabel ?? "Notify me"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleUnavailable(module.status, module)}
                className="inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-xs font-semibold text-foreground hover:border-gigaviz-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold/70"
              >
                {module.status === "setup_required" ? "Complete setup" : "Unlock features"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
