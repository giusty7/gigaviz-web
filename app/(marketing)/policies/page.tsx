import type { Metadata } from "next";
import Link from "next/link";
import { policies } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Policies",
  description: "Gigaviz rules and policies to keep the service safe and trustworthy.",
};

export default function PoliciesPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Rules and Policies
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Policies to Build Trust
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                The documents below explain usage rules and data protection at Gigaviz.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {policies.map((policy) => (
                <Link
                  key={policy.slug}
                  href={`/policies/${policy.slug}`}
                  className="flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 transition hover:-translate-y-1 hover:border-[color:var(--gv-accent)]"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                      {policy.title}
                    </h2>
                    <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                      {policy.description}
                    </p>
                  </div>
                  <span className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gv-accent)]">
                    Read Details
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Need additional clarification?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Contact our team if there are any policy matters you want to discuss.
                </p>
              </div>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)] md:mt-0"
              >
                Contact the Team
              </Link>
            </div>
          </div>
        </section>
    </main>
  );
}
