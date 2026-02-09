import type { Metadata } from "next";
import Link from "next/link";
import { roadmap } from "@/lib/roadmap";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gigaviz Roadmap",
  description: "Gigaviz module development plan from now through the long term.",
};

export default async function RoadmapPage() {
  const t = await getTranslations("roadmap");
  const tc = await getTranslations("common");

  const columns = [
    { title: t("now"), items: roadmap.now },
    { title: t("next"), items: roadmap.next },
    { title: t("later"), items: roadmap.later },
  ] as const;

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
            <div className="grid gap-4 lg:grid-cols-3">
              {columns.map((column) => (
                <div
                  key={column.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="text-lg font-semibold text-[color:var(--gv-text)]">
                    {column.title}
                  </div>
                  <div className="mt-4 space-y-3">
                    {column.items.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] p-4"
                      >
                        <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                          {item.title}
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
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
                {tc("sendFeedback")}
              </Link>
            </div>
          </div>
        </section>
    </main>
  );
}
