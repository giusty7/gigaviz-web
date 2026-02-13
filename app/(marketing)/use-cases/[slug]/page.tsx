import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useCases } from "@/lib/data/use-cases";

export const revalidate = 3600;

/* ── Static params for ISR ───────────────────────────────────── */
export function generateStaticParams() {
  return useCases.map((uc) => ({ slug: uc.slug }));
}

/* ── Metadata ────────────────────────────────────────────────── */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const uc = useCases.find((u) => u.slug === slug);
  if (!uc) return {};
  return {
    title: `${uc.title} — Gigaviz Use Case`,
    description: uc.description,
    alternates: { canonical: `/use-cases/${slug}` },
  };
}

/* ── Page ─────────────────────────────────────────────────────── */
export default async function UseCaseDetail({ params }: Props) {
  const { slug } = await params;
  const uc = useCases.find((u) => u.slug === slug);
  if (!uc) notFound();

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
        <div className="container py-16 md:py-24">
          <Link
            href="/use-cases"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--gv-accent)] hover:underline"
          >
            ← All use cases
          </Link>
          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <span className="text-4xl">{uc.icon}</span>
              <h1 className="mt-3 text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                {uc.headline}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--gv-muted)] md:text-base">
                {uc.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {uc.modules.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-[color:var(--gv-accent)]/30 bg-[color:var(--gv-accent)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--gv-accent)]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:gap-4">
              {uc.metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-center"
                >
                  <p className="text-xl font-bold text-[color:var(--gv-accent)]">
                    {m.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--gv-muted)]">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
        <div className="container py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-2xl">
                The challenge
              </h2>
              <ul className="mt-6 space-y-4">
                {uc.painPoints.map((p) => (
                  <li key={p} className="flex gap-3 text-sm text-[color:var(--gv-muted)]">
                    <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-red-500/15 text-center text-xs leading-5 text-red-400">
                      ✗
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-2xl">
                The Gigaviz solution
              </h2>
              <ul className="mt-6 space-y-4">
                {uc.solutions.map((s) => (
                  <li key={s} className="flex gap-3 text-sm text-[color:var(--gv-muted)]">
                    <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-emerald-500/20 text-center text-xs leading-5 text-emerald-400">
                      ✓
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[color:var(--gv-bg)]">
        <div className="container py-16 text-center md:py-20">
          <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
            Start free with {uc.modules.join(" + ")} — no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/get-started"
              className="rounded-full bg-[color:var(--gv-accent)] px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Start free trial
            </Link>
            <Link
              href="/compare"
              className="rounded-full border border-[color:var(--gv-border)] px-6 py-2.5 text-sm font-semibold text-[color:var(--gv-text)] transition hover:border-[color:var(--gv-accent)]"
            >
              Compare platforms
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
