import type { Metadata } from "next";
import Link from "next/link";
import { MarketingIcon } from "@/components/marketing/icons";

export const revalidate = 3600;
import { StatusBadge } from "@/components/marketing/status-badge";
import { ProductPreview } from "@/components/marketing/product-preview";

export const metadata: Metadata = {
  title: "Gigaviz Office",
  description:
    "AI-powered document automation: auto-generate Excel spreadsheets, Word documents, PDF reports, invoices, and dashboards from your business data.",
  alternates: {
    canonical: "/products/office",
  },
  openGraph: {
    title: "Gigaviz Office",
    description:
      "AI-powered document automation: auto-generate Excel spreadsheets, Word documents, PDF reports, invoices, and dashboards from your business data.",
    url: "/products/office",
  },
};

const summaryPoints = [
  "AI-generated Excel spreadsheets with formulas and data analysis.",
  "Auto-create Word documents, contracts, and business letters.",
  "PDF report and invoice generator from structured data.",
  "Dashboard and KPI report builder for instant business insights.",
];

const problemPoints = [
  "Spend hours creating the same Excel reports every month.",
  "Manually formatting invoices and business documents.",
  "Inconsistent document formats across teams and departments.",
  "No automated way to generate reports from business data.",
  "Need audit-ready documents with professional formatting.",
];

const featureCards = [
  {
    title: "AI Excel Generator",
    desc: "Create spreadsheets with formulas, charts, and data analysis using AI prompts.",
  },
  {
    title: "AI Word Document Creator",
    desc: "Generate business letters, contracts, proposals, and reports with AI.",
  },
  {
    title: "PDF Report Generator",
    desc: "Auto-create professional PDF reports from your business data.",
  },
  {
    title: "Invoice & Receipt Builder",
    desc: "Generate invoices and receipts with your brand and payment details.",
  },
  {
    title: "Dashboard Builder",
    desc: "Build KPI dashboards and visual summaries for performance monitoring.",
  },
  {
    title: "Template Library",
    desc: "Pre-built templates for common business documents — customizable with AI.",
  },
];

const workflowExamples = [
  {
    title: "Monthly report in 10 minutes",
    steps: [
      "Import data from spreadsheet or CSV",
      "Validate and tidy the format",
      "Generate the report document automatically",
      "Export to PDF or share with stakeholders",
    ],
  },
  {
    title: "Commission tracker",
    steps: [
      "Select a commission template",
      "Enter sales data",
      "Use Formula Assistant to calculate commissions",
      "Build a commission KPI dashboard per team",
    ],
  },
  {
    title: "Ops checklist + summary",
    steps: [
      "Fill the operational checklist from a template",
      "Summarize status and key findings",
      "Generate a concise doc for review",
      "Share with relevant teams",
    ],
  },
];

const safetyPoints = [
  {
    title: "Human review for critical output",
    desc: "Ensure final reports are reviewed before important decisions.",
  },
  {
    title: "Versioning template",
    desc: "Templates can be reviewed so format changes stay tracked.",
  },
  {
    title: "Auditability via Core OS",
    desc: "When connected to Core OS, activities can be logged for audit.",
  },
  {
    title: "Accuracy remains limited",
    desc: "Automation helps, but final results still need verification.",
  },
];

const faqs = [
  {
    question: "What formats are supported?",
    answer:
      "Office supports Excel, Google Sheets, and Docs templates. CSV/XLSX import is available.",
  },
  {
    question: "Can it work with Google Sheets and Excel?",
    answer:
      "Yes, with tailored templates. A direct Google Sheets connector is on the roadmap.",
  },
  {
    question: "How does import/export automation work?",
    answer:
      "Data can be uploaded from files or exported back to standard formats per template.",
  },
  {
    question: "Can templates be customized?",
    answer:
      "Yes, templates can be edited to match your team's data structure.",
  },
  {
    question: "How is pricing structured?",
    answer:
      "Office follows subscription plans and module needs; see the pricing page for details.",
  },
  {
    question: "What are the limitations?",
    answer:
      "Office helps structure and automate, but final results still need human review.",
  },
  {
    question: "Are there ready-made dashboards?",
    answer:
      "The dashboard builder provides basic KPIs and can be expanded as needed.",
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
    title: "Gigaviz Helper",
    desc: "AI assistant for drafting, summaries, and light research.",
    href: "/products/helper",
    cta: "View Helper",
  },
  {
    title: "Gigaviz Studio",
    desc: "Creative studio for visual, video, and audio assets.",
    href: "/products/studio",
    cta: "View Studio",
  },
];

export default function OfficePage() {
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
                    name="office"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Office
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Work templates, formula assistant, workflow automation, and document/dashboard generator.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Try Office
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
                  Work templates
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Formula Assistant
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Workflow automation
                </span>
              </div>
            </div>

            <div className="space-y-6">
            <ProductPreview product="office" />
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
                Office simplifies work for finance, ops, and admin teams.
              </div>
            </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                What it solves
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Reduce manual workload and data errors
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                {problemPoints.map((item) => (
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
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Key features
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                All productivity tools in one workflow
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                From templates to automation, Office is designed to make reporting faster.
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Workflow examples
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Real workflows you can use right away
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowExamples.map((workflow) => (
                <div
                  key={workflow.title}
                  className="flex h-full flex-col rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                    {workflow.title}
                  </h3>
                  <ol className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                    {workflow.steps.map((step, index) => (
                      <li key={step} className="flex gap-2">
                        <span className="mt-0.5 text-xs font-semibold text-[color:var(--gv-accent)]">
                          {index + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Security & reliability
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Results you can audit and keep safe
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Office speeds things up, but human review is still recommended.
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
                Questions about Gigaviz Office
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
                  Complete the Office workflow with other modules
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
                  Ready to streamline your team workflows?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Start with simple templates, then automate as you need.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Get started
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
