"use client";

import Link from "next/link";
import FeatureInterestDialog from "@/components/app/FeatureInterestDialog";
import { type ModuleStatus } from "@/components/app/ModuleGrid";

export type QuickAccessModule = {
  key: string;
  name: string;
  description: string;
  status: ModuleStatus;
  href?: string;
};

type QuickAccessSectionProps = {
  workspaceId: string;
  modules: QuickAccessModule[];
};

export default function QuickAccessSection({ workspaceId, modules }: QuickAccessSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Quick Access</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Open primary modules faster. Locked modules are clearly marked.
      </p>
      <FeatureInterestDialog workspaceId={workspaceId}>
        {(openNotify) => (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {modules.map((m) => (
              <div
                key={m.key}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-4 transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-200/20 motion-reduce:transform-none"
              >
                <div>
                  <p className="text-base font-semibold text-foreground">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                </div>
                {m.href && m.status === "available" ? (
                  <Link
                    href={m.href}
                    className="rounded-lg border border-border bg-gigaviz-surface px-3 py-2 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
                  >
                    Open
                  </Link>
                ) : m.status === "coming_soon" ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-slate-900">
                      Coming soon
                    </span>
                    <button
                      type="button"
                      onClick={() => openNotify(m.key, m.name)}
                      className="text-sm font-semibold text-gigaviz-gold hover:underline"
                    >
                      Notify me
                    </button>
                  </div>
                ) : (
                  <span className="rounded-lg border border-amber-200 bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-50">
                    Unlock features
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </FeatureInterestDialog>
    </section>
  );
}
