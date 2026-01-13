import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import ProductsOverview from "@/components/marketing/products-overview";

export const metadata: Metadata = {
  title: "Gigaviz Products",
  description:
    "Explore all Gigaviz modules with category filtering and product status.",
};

export default function ProductsPage() {
  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Gigaviz Products
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                All modules for Create, Automate, Monetize, and Manage.
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Choose modules based on your team needs, or combine several for a more integrated workflow.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <ProductsOverview />
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-14 md:py-20">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Need module recommendations?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Tell us about your team needs, and we will help you find the perfect module combination.
                </p>
              </div>
              <Link
                href="/get-started"
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)] md:mt-0"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
