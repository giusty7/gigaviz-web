import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const EvidenceCarousel = dynamic(
  () =>
    import("@/components/marketing/evidence-carousel").then(
      (m) => m.EvidenceCarousel,
    ),
  { loading: () => <div className="aspect-video animate-pulse rounded-xl bg-[color:var(--gv-surface)]" /> },
);

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Verification & Trust — Gigaviz Ecosystem",
  description:
    "Proof of Technology Provider status for WhatsApp Business Platform, onboarding completed (2/2 steps), built on the official Cloud API.",
};

export default async function TrustPage() {
  const t = await getTranslations("trust");

  const bullets = [t("meaning1"), t("meaning2"), t("meaning3")];

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-background via-card/30 to-background">
          <div className="container space-y-10 py-16 md:py-20">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("badge")}</p>
              <h1 className="text-4xl font-gvDisplay font-semibold md:text-5xl">{t("title")}</h1>
              <p className="text-sm text-muted-foreground md:text-base">
                {t("subtitle")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("statusBadge")}</div>
                <h2 className="mt-3 text-xl font-semibold">{t("statusTitle")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t("statusOnboarding")}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                  {t("statusCloudApi")}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {t("statusNote")}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("linksBadge")}</div>
                <div className="mt-3 space-y-3 text-sm">
                  <Link href="/" className="font-semibold text-gigaviz-gold hover:underline">
                    {t("linksHome")}
                  </Link>
                  <Link href="/integrations" className="block font-semibold text-gigaviz-gold hover:underline">
                    {t("linksIntegrations")}
                  </Link>
                  <Link href="/get-started" className="block font-semibold text-gigaviz-gold hover:underline">
                    {t("linksOnboarding")}
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("evidenceBadge")}</div>
                <div className="mt-4">
                  <EvidenceCarousel aspectClass="aspect-video" showThumbnails />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("evidenceCaption")}
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("meaningBadge")}</div>
                <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                  {bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span aria-hidden className="mt-[6px] h-1.5 w-1.5 rounded-full bg-gigaviz-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-background p-6">
              <h3 className="text-base font-semibold">{t("trademarkTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("trademarkDesc")}
              </p>
            </div>
          </div>
        </section>
    </>
  );
}
