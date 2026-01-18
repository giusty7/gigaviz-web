import type { Metadata } from "next";
import Link from "next/link";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Apps",
  description:
    "Internal app catalog, request build, ticketing, and mini roadmap per workspace for operations.",
  alternates: {
    canonical: "/products/apps",
  },
  openGraph: {
    title: "Gigaviz Apps",
    description:
      "Internal app catalog, request build, ticketing, and mini roadmap per workspace for operations.",
    url: "/products/apps",
  },
};

const summaryPoints = [
  "Internal app catalog to view available or activated modules.",
  "Request new applications with clear scope and business goals.",
  "Ticketing and status tracking for ongoing changes.",
  "Mini roadmap per workspace for transparent prioritization.",
];

const featureCards = [
  {
    title: "App Catalog",
    desc: "List of internal applications ready to use or activate.",
  },
  {
    title: "Request an App",
    desc: "Submit new application needs with brief and business objectives.",
  },
  {
    title: "Ticketing & status tracking",
    desc: "Monitor build progress, changes, and fixes in a structured way.",
  },
  {
    title: "Mini roadmap per workspace",
    desc: "Feature priorities and timelines tailored to each team's needs.",
  },
  {
    title: "Collaboration notes (planned)",
    desc: "Collaboration notes and attachments for organized briefing.",
  },
  {
    title: "SLA & support tiers (planned)",
    desc: "Support levels and SLA prepared for enterprise needs.",
  },
];

const steps = [
  "Submit new application or feature request.",
  "Team defines scope and estimation.",
  "Build executed per priority.",
  "Delivery and handoff to user team.",
  "Ongoing iteration via ticketing.",
];

const useCases = [
  "Internal applications for approval and administration.",
  "Client portal to view project status.",
  "Ops app for inventory or monitoring.",
  "Cross-system data integration.",
  "Custom request forms for sales teams.",
  "Project status dashboard per team.",
  "Small automation for daily operations.",
  "Custom workflows for compliance.",
];

const safetyPoints = [
  {
    title: "Measurable milestones",
    desc: "Each project has milestones for clear and measurable progress.",
  },
  {
    title: "Controlled change requests",
    desc: "Scope changes are logged to avoid impacting main timeline.",
  },
  {
    title: "Access control via Core OS",
    desc: "Access follows roles and workspace when connected to Core OS.",
  },
  {
    title: "Clean documentation",
    desc: "Brief, decisions, and updates are stored for easy audit.",
  },
];

const faqs = [
  {
    question: "What's the difference between Apps and other modules?",
    answer:
      "Apps focus on custom app requests and ticketing, not standard modules.",
  },
  {
    question: "What is the app request process?",
    answer:
      "Team submits a brief, then scope and estimation are agreed before build.",
  },
  {
    question: "Is there a limit to requests?",
    answer:
      "Limits follow subscription plan and workspace priority.",
  },
  {
    question: "Can changes be requested after release?",
    answer:
      "Yes, changes become tickets for the next iteration.",
  },
  {
    question: "Is there an SLA?",
    answer:
      "SLA and support tiers are prepared incrementally for certain plans.",
  },
  {
    question: "How is app access secured?",
    answer:
      "Access follows roles and workspace through Core OS.",
  },
  {
    question: "Does Apps integrate with Arena Commission?",
    answer:
      "Yes, Arena Commission can use Apps as a request channel.",
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
    title: "Gigaviz Pay",
    desc: "Wallet and billing for subscriptions and invoices.",
    href: "/products/pay",
    cta: "View Pay",
  },
  {
    title: "Gigaviz Arena",
    desc: "Commission mini-game and custom requests.",
    href: "/products/arena",
    cta: "View Arena",
  },
  {
    title: "Gigaviz Office",
    desc: "Work templates and document automation for operations.",
    href: "/products/office",
    cta: "View Office",
  },
];

export default function AppsPage() {
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
                    name="apps"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Apps
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Internal app catalog, request build, ticketing, and mini roadmap per workspace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Request App
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
                  App catalog
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Ticketing
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Mini roadmap
                </span>
              </div>
            </div>

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
                Apps helps teams manage custom needs in a structured way.
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
                All app requests in one workflow
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                From catalog to ticketing, Apps keeps custom needs organized.
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
                Quick workflow from request to delivery
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
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Use cases
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Common app requirements
                </h2>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {useCases.map((item) => (
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Process & security
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Measurable and secure projects
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Apps ensures clear milestones, tracked changes, and controlled access.
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                FAQ
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Questions about Gigaviz Apps
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
                  Apps ecosystem support
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
                  Ready to request an app?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Start small and continue iteration via ticketing.
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
