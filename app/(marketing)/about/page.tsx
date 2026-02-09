import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SCHEMA_CONTEXT, personSchema } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Gigaviz",
  description:
    "The story of Gigaviz building a unified digital ecosystem to Create, Automate, Monetize, and Manage.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Gigaviz",
    description:
      "The story of Gigaviz building a unified digital ecosystem to Create, Automate, Monetize, and Manage.",
    url: "/about",
  },
};

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tc = await getTranslations("common");

  const timeline = [
    { title: t("timeline1Title"), desc: t("timeline1Desc") },
    { title: t("timeline2Title"), desc: t("timeline2Desc") },
    { title: t("timeline3Title"), desc: t("timeline3Desc") },
    { title: t("timeline4Title"), desc: t("timeline4Desc") },
    { title: t("timeline5Title"), desc: t("timeline5Desc") },
  ];

  const northStar = [
    { title: t("nsCreateTitle"), desc: t("nsCreateDesc") },
    { title: t("nsAutomateTitle"), desc: t("nsAutomateDesc") },
    { title: t("nsMonetizeTitle"), desc: t("nsMonetizeDesc") },
    { title: t("nsManageTitle"), desc: t("nsManageDesc") },
  ];

  const values = [t("value1"), t("value2"), t("value3"), t("value4"), t("value5")];
  const problems = [t("problem1"), t("problem2"), t("problem3"), t("problem4")];

  const personJsonLd = {
    "@context": SCHEMA_CONTEXT,
    ...personSchema(),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

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
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  {tc("getStarted")}
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("exploreProducts")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("storyBadge")}
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  {t("storyTitle")}
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("storyP1")}
                </p>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("storyP2")}
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                  <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                    {t("founderLabel")}
                  </div>
                  <div className="mt-3 text-sm text-[color:var(--gv-text)]">
                    {t("founderName")}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {t("founderBio")}
                  </p>
                </div>

                <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                  <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                    {t("problemsTitle")}
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                    {problems.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("timelineBadge")}
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                {t("timelineTitle")}
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {timeline.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="text-xs font-semibold text-[color:var(--gv-accent)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("northStarBadge")}
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                {t("northStarTitle")}
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {northStar.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("valuesBadge")}
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  {t("valuesTitle")}
                </h2>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {values.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  {tc("getStarted")}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("viewPricing")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
