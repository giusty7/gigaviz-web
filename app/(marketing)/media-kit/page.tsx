import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const MediaKitCopyBlock = dynamic(
  () => import("@/components/marketing/media-kit-copy"),
);

const MediaKitLogos = dynamic(
  () => import("@/components/marketing/media-kit-logos"),
);

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gigaviz Media Kit",
  description:
    "Official Gigaviz brand assets for press, partners, and community.",
  alternates: {
    canonical: "/media-kit",
  },
  openGraph: {
    title: "Gigaviz Media Kit",
    description:
      "Official Gigaviz brand assets for press, partners, and community.",
    url: "/media-kit",
  },
};

const logoAssets = [
  {
    label: "Logo Horizontal",
    file: "/brand/gigaviz-logo-horizontal.png",
    width: 420,
    height: 120,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Logo Stacked",
    file: "/brand/gigaviz-logo-stacked.png",
    width: 260,
    height: 260,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Mark",
    file: "/brand/gigaviz-mark.png",
    width: 160,
    height: 160,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Mark Gold",
    file: "/brand/gigaviz-mark-gold.png",
    width: 160,
    height: 160,
    previewClass: "bg-[#0b1220]",
  },
  {
    label: "Mark Dark",
    file: "/brand/gigaviz-mark-dark.png",
    width: 160,
    height: 160,
    previewClass: "bg-white",
  },
  {
    label: "Mark Mono",
    file: "/brand/gigaviz-mark-mono.png",
    width: 160,
    height: 160,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
];

const palette = [
  { name: "Gold", hex: "#d6b25e" },
  { name: "Navy", hex: "#0b1220" },
  { name: "Magenta", hex: "#e24ba8" },
  { name: "Cream", hex: "#f7f1e7" },
];

export default async function MediaKitPage() {
  const t = await getTranslations("mediaKit");
  const tc = await getTranslations("common");

  const brandSummary = [t("brand1"), t("brand2"), t("brand3"), t("brand4")];

  const copyBlocks = [
    { title: t("copyShortTitle"), text: t("copyShortText") },
    { title: t("copyStandardTitle"), text: t("copyStandardText") },
    { title: t("copyTaglineTitle"), text: t("copyTaglineText") },
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

          <div className="container relative z-10 py-16 md:py-24">
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
                <a
                  href="#logos"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  {tc("downloadLogos")}
                </a>
                <a
                  href="#copy"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("copyDescriptions")}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("brandBadge")}
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  {t("brandTitle")}
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {brandSummary.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("northStarBadge")}
                </div>
                <div className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
                  {t("northStarTitle")}
                </div>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                  {t("northStarDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="logos" className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("logoBadge")}
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  {t("logoTitle")}
                </h2>
              </div>
              <div className="text-xs text-[color:var(--gv-muted)]">
                {t("logoFileFormat")}
              </div>
            </div>

            <MediaKitLogos items={logoAssets} />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("usageGuideBadge")}
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{t("usageGuide1")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{t("usageGuide2")}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{t("usageGuide3")}</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("bgVariationsBadge")}
                </div>
                <p className="mt-4">
                  {t("bgVariationsDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("colorsBadge")}
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  {t("colorsTitle")}
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("colorsDesc")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {palette.map((color) => (
                  <div
                    key={color.name}
                    className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4"
                  >
                    <div
                      className="h-16 w-full rounded-2xl border border-[color:var(--gv-border)]"
                      style={{ backgroundColor: color.hex }}
                      aria-label={`${color.name} ${color.hex}`}
                    />
                    <div className="mt-3 text-sm font-semibold text-[color:var(--gv-text)]">
                      {color.name}
                    </div>
                    <div className="text-xs text-[color:var(--gv-muted)]">
                      {color.hex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("typoBadge")}
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  {t("typoTitle")}
                </h2>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p>{t("typoPrimary")}</p>
                <p className="mt-2">{t("typoDisplay")}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="copy" className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {t("copyBadge")}
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                {t("copyTitle")}
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                {t("copyDesc")}
              </p>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {copyBlocks.map((item) => (
                <MediaKitCopyBlock key={item.title} title={item.title} text={item.text} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  {t("contactBadge")}
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  {t("contactTitle")}
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("contactFounder")}
                </p>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("contactEntity")}
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p>{t("contactMediaDesc")}</p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("openContact")}
                </Link>
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
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("viewProducts")}
                </Link>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
