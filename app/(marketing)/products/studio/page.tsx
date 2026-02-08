import type { Metadata } from "next";
import Link from "next/link";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";
import { studioChildren, moduleStatusLabel } from "@/lib/modules/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gigaviz Studio - Office, Graph, Tracks",
  description: "Studio suite includes Office, Graph, and Tracks for creative and productive teams.",
};

export default function StudioPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border bg-background">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Gigaviz Studio
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold md:text-4xl">
                Office, Graph, and Tracks in one suite
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Studio combines document automation (Office), visual generation (Graph), and workflow orchestration (Tracks).
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="container py-14 md:py-18">
            <div className="grid gap-4 md:grid-cols-3">
              {studioChildren.map((module) => (
                <div
                  key={module.slug}
                  className="flex h-full flex-col justify-between rounded-3xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-gigaviz-gold/70"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-card">
                      <MarketingIcon name={module.icon} className="h-6 w-6 text-gigaviz-gold" />
                    </div>
                    <StatusBadge status={module.status} />
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-lg font-semibold">{module.name}</h3>
                    <p className="text-sm text-muted-foreground">{module.short}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gigaviz-gold">
                      {moduleStatusLabel[module.status]}
                    </span>
                    <Link
                      href={module.hrefMarketing ?? `/products/${module.slug}`}
                      className="text-xs font-semibold text-gigaviz-gold hover:underline"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
    </main>
  );
}
