import type { Metadata } from "next";
import Link from "next/link";
import { MarketingIcon } from "@/components/marketing/icons";

export const revalidate = 3600;
import { StatusBadge } from "@/components/marketing/status-badge";
import { ProductPreview } from "@/components/marketing/product-preview";

export const metadata: Metadata = {
  title: "Gigaviz Pay",
  description:
    "Wallet, invoicing, payment links, and subscription billing for organized and controlled transactions.",
  alternates: {
    canonical: "/products/pay",
  },
  openGraph: {
    title: "Gigaviz Pay",
    description:
      "Wallet, invoicing, payment links, and subscription billing for organized and controlled transactions.",
    url: "/products/pay",
  },
};

const summaryPoints = [
  "Internal wallet for balance monitoring and fund flow tracking.",
  "Invoice generator for consistent billing.",
  "Payment links for quick payments without complex integrations.",
  "Subscription billing for modular packages and add-ons.",
];

const featureCards = [
  {
    title: "Wallet & balance overview",
    desc: "Centralized view of balance and fund flow (concept).",
  },
  {
    title: "Invoice generator",
    desc: "Create clean invoices with clear payment status.",
  },
  {
    title: "Payment links",
    desc: "Share payment links directly with customers.",
  },
  {
    title: "Subscription billing",
    desc: "Manage subscription packages and add-ons flexibly.",
  },
  {
    title: "Transaction history & exports",
    desc: "Complete transaction history and report exports.",
  },
  {
    title: "Refunds & adjustments (planned)",
    desc: "Adjustments and refunds planned per business policy.",
  },
  {
    title: "Marketplace payouts (planned)",
    desc: "Payouts and commissions for Marketplace creators (phased).",
  },
];

const steps = [
  "Create invoice or payment link.",
  "Customer completes payment.",
  "Transaction status updates automatically.",
  "Transaction recorded in history.",
  "Export data for reporting and reconciliation.",
];

const safetyPoints = [
  {
    title: "Data security",
    desc: "Transaction data stored with layered security controls.",
  },
  {
    title: "Auditability via Core OS",
    desc: "Payment activities can be logged for audit when connected to Core OS.",
  },
  {
    title: "Access control",
    desc: "Access follows roles and workspace to ensure not everyone can modify billing.",
  },
  {
    title: "Fraud prevention (high-level)",
    desc: "Designed to support anomaly detection and risk controls.",
  },
];

const faqs = [
  {
    question: "Which payment methods are supported?",
    answer:
      "Payment methods follow available integrations in your region and will expand progressively.",
  },
  {
    question: "Are there additional fees?",
    answer:
      "Transaction fees depend on method and subscription plan. Details available on pricing.",
  },
  {
    question: "How does subscription billing work?",
    answer:
      "Packages and add-ons can be configured per period with transparent status.",
  },
  {
    question: "Can invoices be customized?",
    answer:
      "Invoices are customized with business details and payment information as needed.",
  },
  {
    question: "How does the refund process work?",
    answer:
      "Refunds are planned as a phased feature per business policy.",
  },
  {
    question: "Are there usage limits?",
    answer:
      "Limits follow your subscription plan and risk policy.",
  },
  {
    question: "Can transaction data be exported?",
    answer:
      "Yes, transaction history can be exported for reporting and reconciliation.",
  },
];

const relatedLinks = [
  {
    title: "Gigaviz Platform (Core OS)",
    desc: "Foundation for accounts, workspaces, and billing across all modules.",
    href: "/products/platform",
    cta: "View Core OS",
  },
  {
    title: "Gigaviz Marketplace",
    desc: "Marketplace for digital product listings and phased payouts.",
    href: "/products/marketplace",
    cta: "View Marketplace",
  },
  {
    title: "Gigaviz Apps",
    desc: "Request custom apps and structured ticketing.",
    href: "/products/apps",
    cta: "View Apps",
  },
  {
    title: "Gigaviz Meta Hub",
    desc: "WhatsApp Cloud API hub for templates and campaigns.",
    href: "/products/meta-hub",
    cta: "View Meta Hub",
  },
];

export default function PayPage() {
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
                    name="pay"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Pay
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Wallet, invoicing, payment links, and subscription billing for organized transactions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Enable Pay
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
                  Wallet
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Invoice
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Subscription
                </span>
              </div>
            </div>

            <div className="space-y-6">
            <ProductPreview product="pay" />
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
                Pay helps finance teams manage transactions in a structured way.
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
                Billing foundation ready to scale
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Pay combines invoicing, payment links, and subscriptions in one workflow.
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
                Clear transaction flow
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
                Security & compliance
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Secure transactions with access control
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Pay is designed to keep payment data secure and auditable.
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
                Questions about Gigaviz Pay
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
                  Pay ecosystem support
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
                  Ready to enable Pay?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Start from simple invoicing to organized subscription billing.
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
