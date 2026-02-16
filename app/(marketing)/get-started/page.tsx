import type { Metadata } from "next";
import dynamic from "next/dynamic";
import TrackedLink from "@/components/analytics/tracked-link";
import { getTranslations } from "next-intl/server";

const GetStartedFunnel = dynamic(
  () => import("@/components/marketing/get-started-funnel"),
  { loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-[color:var(--gv-surface)]" /> },
);

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Get Started with Gigaviz",
  description:
    "Choose the fastest way to enter the Gigaviz ecosystem: Individual or Team (Workspace).",
  alternates: {
    canonical: "/get-started",
  },
  openGraph: {
    title: "Get Started with Gigaviz",
    description:
      "Choose the fastest way to enter the Gigaviz ecosystem: Individual or Team (Workspace).",
    url: "/get-started",
  },
};

type ComparisonRow = {
  label: string;
  individu: string;
  tim: string;
  planned?: boolean;
};

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const t = await getTranslations("getStarted");
  const tc = await getTranslations("common");

  // Pass trial plan through to onboarding
  const planParam = typeof resolvedParams?.plan === "string" ? resolvedParams.plan : "";
  const trialParam = resolvedParams?.trial === "1" ? "1" : "";
  const onboardingUrl = planParam && trialParam
    ? `/login?next=${encodeURIComponent(`/onboarding?plan=${planParam}&trial=1`)}`
    : "/login?next=/onboarding";

  const comparisonRows: ComparisonRow[] = [
    {
      label: t("rowAccountLabel"),
      individu: t("rowAccountIndiv"),
      tim: t("rowAccountTeam"),
    },
    {
      label: t("rowRolesLabel"),
      individu: t("rowRolesIndiv"),
      tim: t("rowRolesTeam"),
    },
    {
      label: t("rowBillingLabel"),
      individu: tc("comingSoon"),
      tim: tc("comingSoon"),
      planned: true,
    },
    {
      label: t("rowAuditLabel"),
      individu: tc("comingSoon"),
      tim: tc("comingSoon"),
      planned: true,
    },
    {
      label: t("rowModuleLabel"),
      individu: t("rowModuleIndiv"),
      tim: t("rowModuleTeam"),
    },
    {
      label: t("rowSupportLabel"),
      individu: t("rowSupportIndiv"),
      tim: t("rowSupportTeam"),
    },
  ];

  const trustPoints = [t("trust1"), t("trust2"), t("trust3")];

  const faqItems = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
    { question: t("faq6Q"), answer: t("faq6A") },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-[color:var(--gv-border)]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,178,94,0.22),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(226,75,168,0.18),_transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(247,241,231,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(247,241,231,0.08) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
          </div>

          <div className="container relative z-10 grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
            <div className="space-y-5">
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
                {planParam && trialParam && (
                  <div className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 mb-2">
                    🎉 14-day free trial for <strong>{planParam.charAt(0).toUpperCase() + planParam.slice(1)}</strong> plan — no payment required!
                  </div>
                )}
                <TrackedLink
                  href={onboardingUrl}
                  label="Create Account"
                  location="get_started_hero"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  {planParam ? tc("startFreeTrial") : tc("createAccount")}
                </TrackedLink>
                <TrackedLink
                  href="/dashboard"
                  label="Sign In"
                  location="get_started_hero"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("signIn")}
                </TrackedLink>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-sm text-[color:var(--gv-muted)]">
                {t("featureNote")}
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("onboardingBadge")}
              </div>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--gv-text)]">
                {t("onboardingTitle")}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                {t("onboardingDesc")}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-[color:var(--gv-muted)]">
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>{t("step1")}</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>{t("step2")}</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>{t("step3")}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <GetStartedFunnel />

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("comparisonBadge")}
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                {t("comparisonTitle")}
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                {t("comparisonSubtitle")}
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[color:var(--gv-muted)]">
                  <thead className="bg-[color:var(--gv-surface)] text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                    <tr>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        {tc("feature")}
                      </th>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        {tc("individual")}
                      </th>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        {tc("teamWorkspace")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.label} className="border-t border-[color:var(--gv-border)]">
                        <td className="px-5 py-4 font-semibold text-[color:var(--gv-text)]">
                          {row.label}
                        </td>
                        <td className="px-5 py-4">
                          {row.planned ? (
                            <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                              {tc("comingSoon")}
                            </span>
                          ) : (
                            row.individu
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {row.planned ? (
                            <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                              {tc("comingSoon")}
                            </span>
                          ) : (
                            row.tim
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("trustBadge")}
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  {t("trustTitle")}
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("trustDesc")}
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-3 text-sm text-[color:var(--gv-muted)]">
                  {trustPoints.map((item) => (
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("faqBadge")}
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                {t("faqTitle")}
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {faqItems.map((item) => (
                <div
                  key={item.question}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {item.answer}
                  </p>
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
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <TrackedLink
                  href={onboardingUrl}
                  label="Create Account"
                  location="get_started_footer"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  {tc("createAccount")}
                </TrackedLink>
                <TrackedLink
                  href="/pricing"
                  label="View Pricing"
                  location="get_started_footer"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("viewPricing")}
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}

