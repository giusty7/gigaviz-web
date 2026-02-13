import type { Metadata } from "next";
import Link from "next/link";
import { MarketingIcon } from "@/components/marketing/icons";

export const revalidate = 3600;
import { StatusBadge } from "@/components/marketing/status-badge";
import { ProductPreview } from "@/components/marketing/product-preview";

export const metadata: Metadata = {
  title: "Gigaviz Community",
  description:
    "Community space for discussions, feedback, showcase work, and events to grow the Gigaviz ecosystem together.",
  alternates: {
    canonical: "/products/community",
  },
  openGraph: {
    title: "Gigaviz Community",
    description:
      "Community space for discussions, feedback, showcase work, and events to grow the Gigaviz ecosystem together.",
    url: "/products/community",
  },
};

const summaryPoints = [
  "Discussion forum and Q&A to share insights.",
  "Feedback board for ideas and voting priorities.",
  "Showcase work and community case studies.",
  "Events and webinars to learn together (optional).",
];

const featureCards = [
  {
    title: "Forum & Q&A",
    desc: "Open discussion space for questions and shared experience.",
  },
  {
    title: "Feedback board",
    desc: "Collect ideas, voting, and track progress.",
  },
  {
    title: "Showcase work",
    desc: "Highlight top work so the community inspires each other.",
  },
  {
    title: "Challenges (optional)",
    desc: "Creative challenges that can connect to Arena.",
  },
  {
    title: "Events & webinars (optional)",
    desc: "Sharing sessions, training, and ecosystem updates.",
  },
  {
    title: "Moderation & safety",
    desc: "Community rules to keep discussions healthy.",
  },
];

const steps = [
  "Join the Community.",
  "Post or ask questions.",
  "Get feedback and discussions.",
  "Showcase top work.",
  "Grow through events or challenges.",
];

const safetyPoints = [
  {
    title: "Content reporting",
    desc: "Users can report content that violates rules.",
  },
  {
    title: "Community guidelines",
    desc: "Behavior guidelines to keep discussions relevant and safe.",
  },
  {
    title: "Anti-spam",
    desc: "Baseline controls to limit spam and excessive promotion.",
  },
  {
    title: "Role-based moderation",
    desc: "Moderation handled by roles with clear responsibilities.",
  },
];

const faqs = [
  {
    question: "Who can join?",
    answer: "All Gigaviz users can join subject to community rules.",
  },
  {
    question: "Is there a fee for Community?",
    answer: "Community follows ecosystem plans. Details are on roadmap or pricing.",
  },
  {
    question: "How does the feedback system work?",
    answer: "Ideas can be submitted and voted to help prioritize the roadmap.",
  },
  {
    question: "Can my work be public?",
    answer: "Showcase is optional; you choose which work to publish.",
  },
  {
    question: "How is moderation done?",
    answer: "Moderation follows guidelines and can be performed by designated roles.",
  },
  {
    question: "Are challenges always available?",
    answer: "Challenges run based on community agenda and campaign needs.",
  },
  {
    question: "Are events provided regularly?",
    answer: "Events and webinars are organized periodically per ecosystem schedule.",
  },
];

const relatedLinks = [
  {
    title: "Gigaviz Studio",
    desc: "Creative studio for visual and audio assets.",
    href: "/products/studio",
    cta: "View Studio",
  },
  {
    title: "Gigaviz Arena",
    desc: "Mini-game based challenges and engagement.",
    href: "/products/arena",
    cta: "View Arena",
  },
  {
    title: "Gigaviz Marketplace",
    desc: "Buy and sell templates, prompt packs, and creative assets.",
    href: "/products/marketplace",
    cta: "View Marketplace",
  },
  {
    title: "Gigaviz Helper",
    desc: "AI assistant for drafting and summarization.",
    href: "/products/helper",
    cta: "View Helper",
  },
];

export default function CommunityPage() {
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
                    name="community"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Community
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Discussion, feedback, and showcase space so the ecosystem grows together.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Join Community
                </Link>
                <Link
                  href="/roadmap"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Roadmap
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Discussion forum
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Feedback board
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Showcase work
                </span>
              </div>
            </div>

            <div className="space-y-6">
            <ProductPreview product="community" />
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Module summary
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                {summaryPoints.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-xs text-[color:var(--gv-muted)]">
                Community connects users, creators, and the Gigaviz team.
              </div>
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
                Active and curated community
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Discussion, feedback, and showcase run in a single safe space.
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
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                How it works
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Simple flow to grow together
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5"
                >
                  <div className="text-xs font-semibold text-[color:var(--gv-accent)]">
                    {index + 1}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Safety & moderation
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Safe and orderly community
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Moderation keeps discussions healthy.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {safetyPoints.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
                    {item.desc}
                  </p>
                </div>
              ))}
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
                Questions about Gigaviz Community
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
                  Community ecosystem support
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  Ready to join the community?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Find inspiration and grow with other creators.
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
