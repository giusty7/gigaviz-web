import type { Metadata } from "next";
import Link from "next/link";
import { useCases } from "@/lib/data/use-cases";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Use Cases — Gigaviz WhatsApp Business Platform",
  description:
    "Discover how Indonesian businesses use Gigaviz for e-commerce, agencies, healthcare, education, and F&B on WhatsApp.",
  alternates: { canonical: "/use-cases" },
};

export default function UseCasesIndex() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full border border-[color:var(--gv-accent)]/30 bg-[color:var(--gv-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--gv-accent)]">
              Use Cases
            </span>
            <h1 className="mt-4 text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
              Built for how Indonesian businesses work
            </h1>
            <p className="mt-3 text-sm text-[color:var(--gv-muted)] md:text-base">
              From online shops to clinics, agencies to restaurants — see how
              teams use Gigaviz to grow on WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
        <div className="container py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <Link
                key={uc.slug}
                href={`/use-cases/${uc.slug}`}
                className="group flex flex-col rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 transition hover:-translate-y-1 hover:border-[color:var(--gv-accent)]/50"
              >
                <span className="text-3xl">{uc.icon}</span>
                <h2 className="mt-3 text-lg font-semibold text-[color:var(--gv-text)] group-hover:text-[color:var(--gv-accent)]">
                  {uc.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-[color:var(--gv-muted)]">
                  {uc.headline}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {uc.modules.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--gv-muted)]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[color:var(--gv-bg)]">
        <div className="container py-16 text-center md:py-20">
          <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
            Don&apos;t see your industry?
          </h2>
          <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
            Gigaviz works for any team that communicates with customers on
            WhatsApp. Start free and configure it your way.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/get-started"
              className="rounded-full bg-[color:var(--gv-accent)] px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Start free trial
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-[color:var(--gv-border)] px-6 py-2.5 text-sm font-semibold text-[color:var(--gv-text)] transition hover:border-[color:var(--gv-accent)]"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
