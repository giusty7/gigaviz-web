import type { Metadata } from "next";
import Link from "next/link";
import { MarketingIcon } from "@/components/marketing/icons";

export const revalidate = 3600;
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Marketplace",
  description:
    "Marketplace to sell and buy templates, prompt packs, creative assets, and mini-apps within the Gigaviz ecosystem.",
  alternates: {
    canonical: "/products/marketplace",
  },
  openGraph: {
    title: "Gigaviz Marketplace",
    description:
      "Marketplace to sell and buy templates, prompt packs, creative assets, and mini-apps within the Gigaviz ecosystem.",
    url: "/products/marketplace",
  },
};

const sellItems = [
  "Office templates (spreadsheets, documents, dashboards)",
  "Prompt packs for Studio and Helper",
  "Ready-to-use creative assets (visual/audio)",
  "Mini-apps and automations from Gigaviz Apps",
];

const featureCards = [
  {
    title: "Structured listings",
    desc: "Digital product catalog that's easy to discover and organize.",
  },
  {
    title: "Personal vs commercial license",
    desc: "License settings to distinguish individual or business use.",
  },
  {
    title: "Discovery",
    desc: "Search, categories, and highlighting of top products.",
  },
  {
    title: "Bundles",
    desc: "Sell template or asset packages in one bundle.",
  },
  {
    title: "Reviews",
    desc: "Reviews and ratings to maintain listing quality.",
  },
  {
    title: "Payout & commission (planned)",
    desc: "Creator payments and marketplace commission planned incrementally.",
  },
];

const safetyPoints = [
  {
    title: "Content curation",
    desc: "Listings follow applicable quality guidelines and copyright standards.",
  },
  {
    title: "Phased moderation",
    desc: "Products violating rules will be reviewed and can be removed.",
  },
  {
    title: "License protection",
    desc: "Products have clear licenses to ensure safe usage.",
  },
];

const faqs = [
  {
    question: "What can I sell on the Marketplace?",
    answer:
      "Office templates, prompt packs, creative assets, and mini-apps relevant to the Gigaviz ecosystem.",
  },
  {
    question: "Can I sell bundles?",
    answer:
      "Yes, bundles are available to sell multiple assets together.",
  },
  {
    question: "How do personal vs commercial licenses work?",
    answer:
      "Personal license for individual use, commercial for business and clients.",
  },
  {
    question: "Is there a curation process?",
    answer:
      "Yes, every listing follows quality guidelines and copyright compliance.",
  },
  {
    question: "When is payout available?",
    answer:
      "Payout and commission will arrive incrementally per Marketplace roadmap.",
  },
  {
    question: "How is digital product pricing set?",
    answer:
      "Creators set prices with standard guidance and regular review.",
  },
  {
    question: "Are there content restrictions?",
    answer:
      "Content violating copyright or policy will be rejected or removed.",
  },
];

const relatedLinks = [
  {
    title: "Gigaviz Platform (Core OS)",
    desc: "Foundation for accounts, workspace, and billing across all modules.",
    href: "/products/platform",
    cta: "View Core OS",
  },
  {
    title: "Gigaviz Studio",
    desc: "Creative studio for visual and audio assets.",
    href: "/products/studio",
    cta: "View Studio",
  },
  {
    title: "Gigaviz Apps",
    desc: "Request, ticketing, and mini roadmap per client.",
    href: "/products/apps",
    cta: "View Apps",
  },
];

export default function MarketplacePage() {
  return (
    <main className="flex-1">
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

          <div className="container relative z-10 grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)]">
                  <MarketingIcon
                    name="marketplace"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Marketplace
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Marketplace to sell and buy templates, prompt packs, creative assets, and mini-apps.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Open Marketplace
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Pricing
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Templates & prompts
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Creative assets
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Mini-apps
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                What you can sell
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                {sellItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-xs text-[color:var(--gv-muted)]">
                Marketplace is prepared for creators who want to monetize digital work.
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Core features
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Marketplace ready to grow with creators
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Features designed to keep listings organized, licenses clear, and transactions secure.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Security & moderation
              </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Moderation to maintain quality
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Marketplace designed to support license compliance and digital product quality.
                </p>
              </div>
              <div className="space-y-3">
                {safetyPoints.map((item) => (
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
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                FAQ
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Questions about Gigaviz Marketplace
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Related modules
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Marketplace ecosystem support
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {relatedLinks.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 transition hover:-translate-y-1 hover:border-[color:var(--gv-accent)]"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gv-accent)]">
                    {item.cta}
                  </div>
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
                  Ready to join the Marketplace?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Create your first listing and expand your digital product reach.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Get Started
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
