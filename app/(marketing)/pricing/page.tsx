import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SCHEMA_CONTEXT, faqPageSchema, type FAQItem } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pricing — Plans for Every Business Size",
  description:
    "Start free, upgrade when you grow. Gigaviz offers competitive WhatsApp Business + AI CRM plans starting from Rp 149.000/month. 14-day free trial on all paid plans.",
};

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const tc = await getTranslations("common");

  const plans = [
    {
      id: "free",
      name: t("freeName"),
      price: "0",
      currency: "Rp",
      period: t("freeForever"),
      desc: t("freeDesc"),
      features: [t("freeF1"), t("freeF2"), t("freeF3"), t("freeF4"), t("freeF5")],
      cta: tc("getStarted"),
      ctaHref: "/get-started",
      highlight: false,
      badge: null,
      annualPrice: "0",
    },
    {
      id: "starter",
      name: t("starterName"),
      price: "149.000",
      currency: "Rp",
      period: t("perMonth"),
      desc: t("starterDesc"),
      features: [t("starterF1"), t("starterF2"), t("starterF3"), t("starterF4"), t("starterF5"), t("starterF6")],
      cta: t("startFreeTrial"),
      ctaHref: "/get-started?plan=starter&trial=1",
      highlight: false,
      badge: null,
      annualPrice: "119.000",
      savings: t("save20"),
    },
    {
      id: "growth",
      name: t("growthName"),
      price: "399.000",
      currency: "Rp",
      period: t("perMonth"),
      desc: t("growthDesc"),
      features: [t("growthF1"), t("growthF2"), t("growthF3"), t("growthF4"), t("growthF5"), t("growthF6"), t("growthF7"), t("growthF8")],
      cta: t("startFreeTrial"),
      ctaHref: "/get-started?plan=growth&trial=1",
      highlight: true,
      badge: t("mostPopular"),
      annualPrice: "319.000",
      savings: t("save20"),
    },
    {
      id: "business",
      name: t("businessName"),
      price: "899.000",
      currency: "Rp",
      period: t("perMonth"),
      desc: t("businessDesc"),
      features: [t("businessF1"), t("businessF2"), t("businessF3"), t("businessF4"), t("businessF5"), t("businessF6"), t("businessF7"), t("businessF8")],
      cta: t("startFreeTrial"),
      ctaHref: "/get-started?plan=business&trial=1",
      highlight: false,
      badge: null,
      annualPrice: "719.000",
      savings: t("save20"),
    },
    {
      id: "enterprise",
      name: t("enterpriseName"),
      price: t("custom"),
      currency: "",
      period: "",
      desc: t("enterpriseDesc"),
      features: [t("enterpriseF1"), t("enterpriseF2"), t("enterpriseF3"), t("enterpriseF4"), t("enterpriseF5"), t("enterpriseF6")],
      cta: tc("talkToSales"),
      ctaHref: "/contact",
      highlight: false,
      badge: null,
      annualPrice: t("custom"),
    },
  ];

  const comparisonCategories = [
    {
      name: t("compCatCore"),
      features: [
        { name: t("compWorkspaces"), free: "1", starter: "1", growth: "3", business: "10", enterprise: t("unlimited") },
        { name: t("compSeats"), free: "1", starter: "3", growth: "10", business: "25", enterprise: t("unlimited") },
        { name: t("compModules"), free: "2", starter: "4", growth: t("all10"), business: t("all10"), enterprise: t("all10") },
        { name: t("compStorage"), free: "100 MB", starter: "1 GB", growth: "5 GB", business: "25 GB", enterprise: t("unlimited") },
      ],
    },
    {
      name: t("compCatMessaging"),
      features: [
        { name: t("compWaMessages"), free: "100", starter: "2.000", growth: "10.000", business: "50.000", enterprise: t("unlimited") },
        { name: t("compWhatsApp"), free: "✓", starter: "✓", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compInstagram"), free: "—", starter: "—", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compMessenger"), free: "—", starter: "—", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compMassBlast"), free: "—", starter: "—", growth: "—", business: "✓", enterprise: "✓" },
      ],
    },
    {
      name: t("compCatAI"),
      features: [
        { name: t("compAiTokens"), free: "5.000", starter: "50.000", growth: "200.000", business: "1.000.000", enterprise: t("unlimited") },
        { name: t("compHelperChat"), free: "✓", starter: "✓", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compAiAutoReply"), free: "—", starter: "✓", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compRagKb"), free: "—", starter: "—", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compCrmInsights"), free: "—", starter: "—", growth: "✓", business: "✓", enterprise: "✓" },
      ],
    },
    {
      name: t("compCatPlatform"),
      features: [
        { name: t("compRbac"), free: "—", starter: "✓", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compAuditLog"), free: "—", starter: "—", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compAutomation"), free: "—", starter: "—", growth: "✓", business: "✓", enterprise: "✓" },
        { name: t("compAnalytics"), free: "—", starter: "—", growth: "—", business: "✓", enterprise: "✓" },
        { name: t("compDedicatedAm"), free: "—", starter: "—", growth: "—", business: "—", enterprise: "✓" },
        { name: t("compCustomSla"), free: "—", starter: "—", growth: "—", business: "—", enterprise: "✓" },
      ],
    },
  ];

  const platformIncludes = [t("include1"), t("include2"), t("include3"), t("include4"), t("include5")];

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

  const tierIds = ["free", "starter", "growth", "business", "enterprise"] as const;

  return (
    <>
      {/* Hero */}
      <section className="border-b border-[color:var(--gv-border)]">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gv-accent)]/30 bg-[color:var(--gv-accent-soft)] px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[color:var(--gv-accent)] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--gv-accent)]">
                {t("trialBadge")}
              </span>
            </div>
            <h1 className="text-balance text-3xl font-gvDisplay font-bold text-[color:var(--gv-text)] md:text-5xl">
              {t("title")}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-[color:var(--gv-muted)] md:text-lg">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
        <div className="container py-12 md:py-20">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col justify-between rounded-3xl border p-6 transition-all duration-200 ${
                  plan.highlight
                    ? "border-[color:var(--gv-accent)] bg-gradient-to-b from-[color:var(--gv-accent-soft)] to-[color:var(--gv-card-soft)] shadow-lg shadow-[color:var(--gv-accent)]/10 ring-1 ring-[color:var(--gv-accent)]/20 scale-[1.02] z-10"
                    : "border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] hover:border-[color:var(--gv-accent)]/40 hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[color:var(--gv-accent)] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-bold text-[color:var(--gv-text)]">{plan.name}</h2>

                  <div className="mt-3 flex items-baseline gap-1">
                    {plan.currency && (
                      <span className="text-sm font-medium text-[color:var(--gv-muted)]">{plan.currency}</span>
                    )}
                    <span className={`font-bold text-[color:var(--gv-text)] ${plan.price === "0" || plan.price === t("custom") ? "text-2xl" : "text-3xl"}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-[color:var(--gv-muted)]">{plan.period}</span>
                    )}
                  </div>

                  {plan.savings && (
                    <p className="mt-1 text-xs font-medium text-emerald-500">
                      {t("annualLabel")}: Rp {plan.annualPrice}{t("perMonth")} ({plan.savings})
                    </p>
                  )}

                  <p className="mt-3 text-sm text-[color:var(--gv-muted)] leading-relaxed">
                    {plan.desc}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-[color:var(--gv-muted)]">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gv-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`mt-6 inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-[color:var(--gv-accent)] text-slate-900 shadow-md shadow-[color:var(--gv-accent)]/20 hover:brightness-110"
                      : plan.id === "free"
                        ? "border border-[color:var(--gv-border)] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)] hover:text-[color:var(--gv-accent)]"
                        : "bg-[color:var(--gv-accent)] text-slate-900 hover:brightness-110"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[color:var(--gv-muted)]">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t("proofVerified")}
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[color:var(--gv-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("proofTrial")}
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {t("proofCancel")}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
              {t("comparisonBadge")}
            </p>
            <h2 className="text-2xl font-gvDisplay font-bold text-[color:var(--gv-text)] md:text-3xl">
              {t("comparisonTitle")}
            </h2>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--gv-border)]">
                  <th className="py-4 pr-4 text-left text-sm font-medium text-[color:var(--gv-muted)]">{t("compFeature")}</th>
                  {tierIds.map((id) => (
                    <th
                      key={id}
                      className={`px-3 py-4 text-center text-sm font-semibold ${
                        id === "growth" ? "text-[color:var(--gv-accent)]" : "text-[color:var(--gv-text)]"
                      }`}
                    >
                      {plans.find((p) => p.id === id)?.name ?? id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((cat) => (
                  <Fragment key={`cat-${cat.name}`}>
                    <tr className="border-b border-[color:var(--gv-border)]/50">
                      <td colSpan={6} className="pt-6 pb-2 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--gv-accent)]">
                        {cat.name}
                      </td>
                    </tr>
                    {cat.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-[color:var(--gv-border)]/30 hover:bg-[color:var(--gv-surface)]/50">
                        <td className="py-3 pr-4 text-sm text-[color:var(--gv-text)]">{feature.name}</td>
                        {(["free", "starter", "growth", "business", "enterprise"] as const).map((tier) => (
                          <td
                            key={tier}
                            className={`px-3 py-3 text-center text-sm ${
                              tier === "growth"
                                ? "bg-[color:var(--gv-accent-soft)]/30 font-medium text-[color:var(--gv-text)]"
                                : "text-[color:var(--gv-muted)]"
                            }`}
                          >
                            {feature[tier]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Always Included + Assurance */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
        <div className="container py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("alwaysIncludedBadge")}
              </p>
              <h2 className="mt-2 text-2xl font-gvDisplay font-bold text-[color:var(--gv-text)]">
                {t("alwaysIncludedTitle")}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                {t("alwaysIncludedDesc")}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[color:var(--gv-muted)]">
                {platformIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gv-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5">
                <div className="text-sm font-semibold text-[color:var(--gv-text)]">{t("assurancePhasedTitle")}</div>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">{t("assurancePhasedDesc")}</p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5">
                <div className="text-sm font-semibold text-[color:var(--gv-text)]">{t("assuranceBudgetTitle")}</div>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">{t("assuranceBudgetDesc")}</p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-accent-2)] bg-[color:var(--gv-magenta-soft)] p-5 text-sm text-[color:var(--gv-text)]">
                {t("assuranceNote")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token pricing */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
        <div className="container py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("tokenBadge")}
              </p>
              <h2 className="text-2xl font-gvDisplay font-bold text-[color:var(--gv-text)]">
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

      {/* Enterprise CTA */}
      <section className="bg-[color:var(--gv-bg)]">
        <div className="container py-12 md:py-16">
          <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-8 md:flex md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[color:var(--gv-text)]">
                {t("customPlanTitle")}
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                {t("customPlanDesc")}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-6 py-3 text-sm font-semibold text-slate-900 hover:brightness-110 shadow-sm"
              >
                {tc("getStarted")}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-6 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
              >
                {tc("talkToSales")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
        <div className="container py-12 md:py-16">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">FAQ</p>
            <h2 className="text-2xl font-gvDisplay font-bold text-[color:var(--gv-text)]">
              {t("faqTitle")}
            </h2>
            <p className="text-sm text-[color:var(--gv-muted)]">{t("faqSubtitle")}</p>
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
                <p className="mt-3 text-sm text-[color:var(--gv-muted)]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
