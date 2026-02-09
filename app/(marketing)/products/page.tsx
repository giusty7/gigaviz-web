import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const ProductsOverview = dynamic(
  () => import("@/components/marketing/products-overview"),
  { loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-[color:var(--gv-surface)]" /> },
);

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gigaviz Products",
  description:
    "Explore all Gigaviz modules with category filtering and product status.",
};

export default async function ProductsPage() {
  const t = await getTranslations("products");
  const tc = await getTranslations("common");

  return (
    <main className="flex-1">
      <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("badge")}
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                {t("title")}
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                {t("subtitle")}
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
                  {t("ctaTitle")}
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("ctaDesc")}
                </p>
              </div>
              <Link
                href="/get-started"
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)] md:mt-0"
              >
                {tc("getStarted")}
              </Link>
            </div>
          </div>
        </section>
    </main>
  );
}
