import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SCHEMA_CONTEXT, faqPageSchema, type FAQItem } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Gigaviz subscription plans with flexible modules, guided onboarding, and transparent token usage reporting.",
};

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const tc = await getTranslations("common");

  const plans = [
    {
      name: t("starterName"),
      price: t("starterPrice"),
      note: t("starterNote"),
      desc: t("starterDesc"),
      features: [t("starterF1"), t("starterF2"), t("starterF3"), t("starterF4")],
    },
    {
      name: t("proName"),
      price: t("proPrice"),
      note: t("proNote"),
      desc: t("proDesc"),
      features: [t("proF1"), t("proF2"), t("proF3"), t("proF4")],
      highlight: t("mostPopular"),
    },
    {
      name: t("businessName"),
      price: t("businessPrice"),
      note: t("businessNote"),
      desc: t("businessDesc"),
      features: [t("businessF1"), t("businessF2"), t("businessF3"), t("businessF4")],
    },
    {
      name: t("enterpriseName"),
      price: t("enterprisePrice"),
      note: t("enterpriseNote"),
      desc: t("enterpriseDesc"),
      features: [t("enterpriseF1"), t("enterpriseF2"), t("enterpriseF3"), t("enterpriseF4")],
    },
  ];

  const platformIncludes = [t("include1"), t("include2"), t("include3"), t("include4"), t("include5")];

  const assuranceItems = [
    { title: t("assurancePhasedTitle"), desc: t("assurancePhasedDesc") },
    { title: t("assuranceBudgetTitle"), desc: t("assuranceBudgetDesc") },
    { title: t("assuranceSupportTitle"), desc: t("assuranceSupportDesc") },
  ];

  const faqs: FAQItem[] = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
    { question: t("faq6Q"), answer: t("faq6A") },
    { question: t("faq7Q"), answer: t("faq7A") },
    { question: t("faq8Q"), answer: t("faq8A") },
  ];

  const faqJsonLd = {
    "@context": SCHEMA_CONTEXT,
    ...faqPageSchema(faqs),
  };

  return (
    <main className="flex-1">
      <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className="flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                        {plan.name}
                      </h2>
                      {plan.highlight ? (
                        <span className="rounded-full border border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gv-accent)]">
                          {plan.highlight}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                      {plan.note}
                    </p>
                    <div className="mt-2 text-2xl font-semibold text-[color:var(--gv-text)]">
                      {plan.price}
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                      {plan.desc}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="/get-started"
                    className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                  >
                    {tc("getStarted")}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("alwaysIncludedBadge")}
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  {t("alwaysIncludedTitle")}
                </h2>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                  {t("alwaysIncludedDesc")}
                </p>
                <ul className="mt-6 space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {platformIncludes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                {assuranceItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5"
                  >
                    <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                      {item.desc}
                    </p>
                  </div>
                ))}
                <div className="rounded-3xl border border-[color:var(--gv-accent-2)] bg-[color:var(--gv-magenta-soft)] p-5 text-sm text-[color:var(--gv-text)]">
                  {t("assuranceNote")}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("tokenBadge")}
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  {t("tokenTitle")}
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("tokenDesc")}
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">{t("tokenNotesTitle")}</p>
                <ul className="mt-3 space-y-2">
                  <li>- {t("tokenNote1")}</li>
                  <li>- {t("tokenNote2")}</li>
                  <li>- {t("tokenNote3")}</li>
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
                  {t("customPlanTitle")}
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("customPlanDesc")}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  {tc("startSubscription")}
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("talkToSales")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl space-y-3 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                FAQ
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                {t("faqTitle")}
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                {t("faqSubtitle")}
              </p>
            </div>
            <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
              {faqs.map((item) => (
                <div
                  key={item.question}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.question}
                  </h3>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
    </main>
  );
}
