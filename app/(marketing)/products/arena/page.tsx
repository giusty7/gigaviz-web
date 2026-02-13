import type { Metadata } from "next";
import Link from "next/link";
import { MarketingIcon } from "@/components/marketing/icons";

export const revalidate = 3600;
import { StatusBadge } from "@/components/marketing/status-badge";
import { ProductPreview } from "@/components/marketing/product-preview";

export const metadata: Metadata = {
  title: "Gigaviz Arena",
  description:
    "Play, create, and commission mini-games for brand engagement with safe templates and guided workflow.",
  alternates: {
    canonical: "/products/arena",
  },
  openGraph: {
    title: "Gigaviz Arena",
    description:
      "Play, create, and commission mini-games for brand engagement with safe templates and guided workflow.",
    url: "/products/arena",
  },
};

const playItems = [
  "Curated original games from Gigaviz",
  "Lightweight format for short campaigns",
  "Prepared for regular content updates",
];

const createItems = [
  "Template-based mini-game builder (planned)",
  "Theme variations and simple branding",
  "Control game duration and flow",
];

const commissionItems = [
  "Request custom games per campaign",
  "Connected to Apps for ticketing and roadmap",
  "Scope and timeline review per project",
];

const gamificationItems = [
  "Seasonal challenges for engagement",
  "Lightweight badges and progress",
  "Simple leaderboard (optional)",
];

const safetyPoints = [
  {
    title: "Template-based sandbox",
    desc: "Game creation is limited to templates to stay safe and controlled.",
  },
  {
    title: "No arbitrary code execution",
    desc: "Arena doesn't allow arbitrary code execution to maintain security.",
  },
  {
    title: "Content moderation",
    desc: "Game content is evaluated to align with brand policies.",
  },
];

const faqs = [
  {
    question: "What is Gigaviz Arena?",
    answer:
      "Arena is a module to play, create, and commission mini-games to boost engagement.",
  },
  {
    question: "Can I create games myself?",
    answer:
      "Template-based builder is prepared incrementally. Currently focused on curation and requests.",
  },
  {
    question: "How do I request a custom game?",
    answer:
      "Request is done through Apps with agreed brief, scope, and timeline.",
  },
  {
    question: "Are there gamification features?",
    answer:
      "Gamification like badges and leaderboard are available optionally.",
  },
  {
    question: "Is it safe for brand campaigns?",
    answer:
      "Arena is designed with templates and content controls for brand safety.",
  },
  {
    question: "How is Arena priced?",
    answer:
      "Pricing follows subscription plans and custom game production needs.",
  },
  {
    question: "What are Arena's main limitations?",
    answer:
      "Focus on lightweight games and templates. Advanced features arrive incrementally.",
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
    desc: "Ticketing and requests for custom needs.",
    href: "/products/apps",
    cta: "View Apps",
  },
];

export default function ArenaPage() {
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
                    name="arena"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Arena
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Play - Create - Commission for lightweight and safe mini-game campaigns.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/products/arena#play"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Play Demo
                </Link>
                <Link
                  href="/products/arena#create"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Create Mini-Game
                </Link>
                <Link
                  href="/products/arena#commission"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Request Game
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Arena Play
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Arena Create
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Arena Commission
                </span>
              </div>
            </div>

            <div className="space-y-6">
            <ProductPreview product="arena" />
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Arena overview
              </h2>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                Arena combines game catalog, template builder, and custom game requests in one workflow.
              </p>
              <div className="mt-4 grid gap-3 text-sm text-[color:var(--gv-muted)]">
                <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4">
                  Play - curated game collection for quick engagement.
                </div>
                <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4">
                  Create - template builder for lightweight mini-games.
                </div>
                <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4">
                  Commission - request custom games via Apps.
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>

        <section id="play" className="scroll-mt-24 border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Arena Play
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Curated games for quick campaigns
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Collection of lightweight games ready for brand activation.
                </p>
              </div>
              <ul className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {playItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="create" className="scroll-mt-24 border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Arena Create
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Template-based mini-game builder
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Template builder allows teams to create games without technical complexity.
                </p>
              </div>
              <ul className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {createItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="commission" className="scroll-mt-24 border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Arena Commission
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Request custom games for brand
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Teams can order exclusive games with clear brief and scope.
                </p>
              </div>
              <ul className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {commissionItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Gamification
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  More fun engagement (optional)
                </h2>
              </div>
              <ul className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {gamificationItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Security
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Arena is safe with clear controls
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Builder and content are curated to fit brand campaigns.
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                FAQ
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Questions about Gigaviz Arena
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Related modules
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Arena ecosystem support
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
                  Ready to try Arena?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Start with curated games or request a custom game.
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
