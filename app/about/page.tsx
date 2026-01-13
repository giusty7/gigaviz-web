import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SCHEMA_CONTEXT, personSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "About Gigaviz",
  description:
    "The story of Gigaviz building a unified digital ecosystem to Create, Automate, Monetize, and Manage.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Gigaviz",
    description:
      "The story of Gigaviz building a unified digital ecosystem to Create, Automate, Monetize, and Manage.",
    url: "/about",
  },
};

const timeline = [
  {
    title: "Early experiments",
    desc: "Started from the practical needs of a small team requiring fast, organized workflows.",
  },
  {
    title: "First module launched",
    desc: "Began with messaging and operational solutions, then evolved into a suite of modules.",
  },
  {
    title: "Integrated platform",
    desc: "All modules unified with consistent identity, workspace, and billing systems.",
  },
  {
    title: "Legal entity",
    desc: "PT Gigaviz Digital Indonesia established as the operational foundation for ecosystem expansion.",
  },
  {
    title: "Ecosystem v1.1",
    desc: "Focused on Create, Automate, Monetize, and Manage in one unified system.",
  },
];

const northStar = [
  {
    title: "Create",
    desc: "Help teams produce content, assets, and work materials faster.",
  },
  {
    title: "Automate",
    desc: "Automate routine processes so teams can focus on strategic work.",
  },
  {
    title: "Monetize",
    desc: "Provide billing and transaction tools to support revenue growth.",
  },
  {
    title: "Manage",
    desc: "Control access, audit trails, and dashboards to scale safely.",
  },
];

const values = [
  "Clarity over complexity",
  "Security-first from day one",
  "Practical by default",
  "Measurable outcomes",
  "Iterate based on feedback",
];

export default function AboutPage() {
  const personJsonLd = {
    "@context": SCHEMA_CONTEXT,
    ...personSchema(),
  };

  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                About Gigaviz
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                About Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Unified Digital Ecosystem to Create -&gt; Automate -&gt; Monetize -&gt; Manage.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Get Started
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Explore Products
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Our Story
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  From practical needs to a unified ecosystem
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Gigaviz started from a real problem: small teams needed to move fast without losing control.
                  From there, we designed modules that eventually converged into one unified system.
                  Operated by PT Gigaviz Digital Indonesia, this ecosystem is designed to accelerate
                  execution while maintaining clarity and security.
                </p>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  With the Create -&gt; Automate -&gt; Monetize -&gt; Manage framework, each module is built to
                  reinforce the others — from content production to access control and billing.
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                  <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                    Founder
                  </div>
                  <div className="mt-3 text-sm text-[color:var(--gv-text)]">
                    Giusty Adhyarachmat Eryan (Giusty)
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    Giusty built Gigaviz so teams can focus on results without being distracted by disconnected tools.
                    His mission is to deliver an ecosystem that is practical, secure, and measurable.
                  </p>
                </div>

                <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                  <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                    Problems we solve
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                    <li className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>Fast execution without operational chaos.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>Clear decision-making through data and audit trails.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>Access control to keep teams secure as they grow.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>Measurable monetization through integrated billing.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Timeline
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Journey to Ecosystem v1.1
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {timeline.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="text-xs font-semibold text-[color:var(--gv-accent)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
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
                North Star
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Create, Automate, Monetize, Manage
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {northStar.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Values
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Principles that keep us focused
                </h2>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {values.map((item) => (
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

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Ready to move forward with Gigaviz?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Get Started now to streamline your team workflow.
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
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Pricing
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
