import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Meta Hub",
  description:
    "WhatsApp Cloud API hub for templates, webhooks, inbox, scheduler, and analytics with a focus on compliance and scalability.",
  alternates: {
    canonical: "/products/meta-hub",
  },
  openGraph: {
    title: "Gigaviz Meta Hub",
    description:
      "WhatsApp Cloud API hub for templates, webhooks, inbox, scheduler, and analytics with a focus on compliance and scalability.",
    url: "/products/meta-hub",
  },
};

const summaryPoints = [
  "WhatsApp Cloud API integration for WABA and Phone Number ID (independent provider, BSP as upgrade path).",
  "Template Manager and Webhook Receiver for approval, incoming messages, and delivery status callbacks.",
  "Shared Inbox and Campaign Scheduler for scheduled broadcasts with opt-in/opt-out.",
  "Delivery/read/fail analytics and campaign performance summaries.",
];

const featureCards = [
  {
    title: "WhatsApp Cloud API Integration",
    desc: "Connect WABA/Phone Number ID directly to Gigaviz. Currently independent provider; BSP available as upgrade roadmap.",
  },
  {
    title: "Template Manager",
    desc: "Manage approved templates, categories, languages, and dynamic variables for consistent messaging.",
  },
  {
    title: "Webhook Receiver",
    desc: "Receive incoming messages and delivery status callbacks for internal system synchronization.",
  },
  {
    title: "Shared Inbox",
    desc: "Centralized inbox for team replies. Assignment and notes are on the roadmap.",
  },
  {
    title: "Campaign Scheduler",
    desc: "Scheduled broadcasts with timing control. Advanced segmentation is planned.",
  },
  {
    title: "Opt-in / Opt-out",
    desc: "Manage user consent and respect unsubscribe requests.",
  },
  {
    title: "Analytics",
    desc: "Delivery/read/fail reports and performance summaries per campaign.",
  },
];

const compliancePoints = [
  {
    title: "Required consent",
    desc: "Message delivery is designed to support valid consent, and opt-out requests must be honored.",
  },
  {
    title: "WhatsApp template rules",
    desc: "Templates follow Meta guidelines and go through official approval before use.",
  },
  {
    title: "Rate limiting / throttling",
    desc: "Designed to support rate limiting to avoid bans and unexpected cost spikes.",
  },
  {
    title: "Anti-abuse & data privacy",
    desc: "Data protection principles and abuse prevention are applied incrementally based on team needs.",
  },
];

const howItWorks = [
  {
    title: "Connect WABA/Phone Number ID",
    desc: "Link your Meta account and approved number to enable message delivery.",
  },
  {
    title: "Configure Webhook",
    desc: "Set up webhook endpoints for incoming messages and delivery status.",
  },
  {
    title: "Create/Manage Templates",
    desc: "Prepare templates, categories, and languages, then submit for approval.",
  },
  {
    title: "Launch Campaign / Manage Inbox",
    desc: "Schedule broadcasts and manage team conversations from the shared inbox.",
  },
  {
    title: "Review Analytics & Logs",
    desc: "Monitor delivery, read, fail metrics and activity logs for evaluation.",
  },
];

const faqs = [
  {
    question: "What is WhatsApp Cloud API?",
    answer:
      "WhatsApp Cloud API is Meta's official API for sending and receiving WhatsApp messages programmatically from your server.",
  },
  {
    question: "Do I need a verified business account?",
    answer:
      "Not always to get started. However, business verification is often required for templates and higher sending volumes.",
  },
  {
    question: "What does Beta status mean?",
    answer:
      "Core features are available, but some capabilities are still developing. Changes and adjustments may occur.",
  },
  {
    question: "How do opt-in and opt-out work?",
    answer:
      "Messages are sent only after user consent. Opt-out requests must be honored and stored as preferences.",
  },
  {
    question: "What affects message cost?",
    answer:
      "Cost is determined by Meta based on template category, destination country, and conversation type.",
  },
  {
    question: "What's the difference between independent provider and BSP?",
    answer:
      "Independent provider uses Cloud API directly from Meta. BSP is an upgrade path for enterprise support and additional services.",
  },
  {
    question: "Is there rate limiting?",
    answer:
      "The platform is designed to support throttling and schedule control to maintain delivery quality and cost efficiency.",
  },
  {
    question: "What about data security?",
    answer:
      "Designed to isolate data per workspace and log important activities for audit compliance.",
  },
];

const relatedLinks = [
  {
    title: "Gigaviz Platform (Core OS)",
    desc: "Foundation for accounts, workspaces, billing, and RBAC across all modules.",
    href: "/products/platform",
    cta: "View Core OS",
  },
  {
    title: "Policies & Compliance",
    desc: "Learn Gigaviz usage rules and privacy policy.",
    href: "/policies",
    cta: "View Policies",
  },
  {
    title: "Pricing",
    desc: "Subscription plans for messaging modules and team needs.",
    href: "/pricing",
    cta: "View Pricing",
  },
];

export default function MetaHubPage() {
  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

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
                    name="meta"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Meta Hub
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  WhatsApp Cloud API hub for templates, webhooks, inbox, scheduler, and analytics.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Get Started
                </Link>
                <Link
                  href="/policies"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] bg-transparent px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Policies
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
                  WhatsApp Cloud API
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Template Manager
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Shared Inbox
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
                Meta Hub runs on top of Core OS for authentication, workspace, and billing.
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
                All essential components for modern team messaging
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Meta Hub combines integration, template management, inbox, scheduler, and analytics in one place.
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
                  Compliance & security
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Compliance and security as priority
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Designed to support WhatsApp rule compliance and maintain delivery reputation.
                </p>
              </div>
              <div className="space-y-3">
                {compliancePoints.map((item) => (
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
                  How it works
                </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Simple workflow from integration to analytics
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {howItWorks.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] text-sm font-semibold text-[color:var(--gv-accent)]">
                      {index + 1}
                    </div>
                    <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
                    {step.desc}
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
                Frequently asked questions
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
                  Foundations and policies supporting Meta Hub
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
                  Ready to run Meta Hub?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Start WhatsApp Cloud API integration and manage campaigns with your team.
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

      <Footer />
    </div>
  );
}
