import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Gigaviz subscription plans with flexible modules, guided onboarding, and transparent token usage reporting.",
};

const plans = [
  {
    name: "Starter",
    price: "Rp 299.000",
    note: "Starting from",
    desc: "For small teams needing core modules and basic workflows.",
    features: [
      "Access to Core OS and Workspace",
      "2 active modules",
      "1 workspace",
      "Basic email support",
    ],
  },
  {
    name: "Pro",
    price: "Rp 799.000",
    note: "Starting from",
    desc: "For operational teams needing automation and inbox management.",
    features: [
      "All Starter features",
      "5 active modules",
      "Campaign scheduler",
      "Priority support",
    ],
    highlight: "Most Popular",
  },
  {
    name: "Business",
    price: "Rp 1.900.000",
    note: "Starting from",
    desc: "For teams needing multi-workspace support and advanced integrations.",
    features: [
      "All Pro features",
      "10 active modules",
      "Multi-workspace support",
      "Advanced roles and audit logs",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "Contact Sales",
    desc: "For enterprise needs, custom SLA, and specialized integrations.",
    features: [
      "All Business features",
      "Custom SLA and onboarding",
      "Custom integrations",
      "Dedicated account manager",
    ],
  },
];

const platformIncludes = [
  "Single sign-on and role management",
  "Core operational workflow templates",
  "Onboarding and quick training for core teams",
  "Audit trail for critical activities",
  "Product roadmap aligned with team needs",
];

const assuranceItems = [
  {
    title: "Phased Setup",
    desc: "Staged implementation plan to ensure teams are ready without overwhelming them.",
  },
  {
    title: "Budget Control",
    desc: "Usage limits per workspace with periodic usage reports.",
  },
  {
    title: "Priority Support",
    desc: "Custom SLA for Business and Enterprise plans.",
  },
];

export default function PricingPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Pricing
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Subscription plans for the entire ecosystem
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Pricing below are starting prices and can be adjusted based on module requirements and usage volume.
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
                    Get Started
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
                  Always Included
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Foundation of the Gigaviz ecosystem
                </h2>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                  Every plan includes core modules and initial setup so your team can start operating immediately.
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
                  Business & Enterprise plans receive quarterly roadmap reviews and module adjustments.
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
                  Token Usage
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Token-based AI generation pricing
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Tokens are used for AI features such as copy generation, summarization, and creative studio. Token pricing may change based on model costs and usage.
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">Usage Notes</p>
                <ul className="mt-3 space-y-2">
                  <li>- Tokens are calculated per output or request.</li>
                  <li>- Token pricing will be displayed before heavy usage.</li>
                  <li>- You can set token limits per workspace.</li>
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
                  Looking for a custom plan?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Contact our team for enterprise plans, custom SLA, and specialized integrations.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Start subscription
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Talk to sales
                </Link>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
