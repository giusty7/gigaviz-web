import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import GetStartedFunnel from "@/components/marketing/get-started-funnel";
import TrackedLink from "@/components/analytics/tracked-link";

export const metadata: Metadata = {
  title: "Get Started with Gigaviz",
  description:
    "Choose the fastest way to enter the Gigaviz ecosystem: Individual or Team (Workspace).",
  alternates: {
    canonical: "/get-started",
  },
  openGraph: {
    title: "Get Started with Gigaviz",
    description:
      "Choose the fastest way to enter the Gigaviz ecosystem: Individual or Team (Workspace).",
    url: "/get-started",
  },
};

type ComparisonRow = {
  label: string;
  individu: string;
  tim: string;
  planned?: boolean;
};

const comparisonRows: ComparisonRow[] = [
  {
    label: "Account & workspace",
    individu: "1 workspace, 1 user",
    tim: "Multi workspace, multi member",
  },
  {
    label: "Roles & permissions",
    individu: "Basic owner access",
    tim: "Owner, Admin, Member, Viewer",
  },
  {
    label: "Billing & invoice",
    individu: "Coming soon",
    tim: "Coming soon",
    planned: true,
  },
  {
    label: "Audit log",
    individu: "Coming soon",
    tim: "Coming soon",
    planned: true,
  },
  {
    label: "Module access",
    individu: "Limited by plan",
    tim: "Broader based on plan",
  },
  {
    label: "Support",
    individu: "Documentation + community",
    tim: "Priority based on plan",
  },
];

const trustPoints = [
  "Security-first with input validation and access control.",
  "Auditability for critical workspace activities.",
  "Fair use and anti-abuse to maintain service quality.",
];

const faqItems = [
  {
    question: "Can I sign up for free?",
    answer:
      "Yes. Free accounts have limited access (view-only/locked) until you activate a plan.",
  },
  {
    question: "What's the difference between Individual and Team?",
    answer:
      "Individual is for solo creators with 1 workspace. Team provides multi-member access, RBAC, and more comprehensive controls.",
  },
  {
    question: "What are token costs?",
    answer:
      "Tokens are AI and WhatsApp API usage charges calculated separately from subscriptions, based on actual usage.",
  },
  {
    question: "Can I upgrade or downgrade?",
    answer:
      "Yes, your plan can be adjusted anytime based on your team's needs and activated modules.",
  },
  {
    question: "Do I need a credit card?",
    answer:
      "Not always. Payment methods depend on your plan and applicable billing policies.",
  },
  {
    question: "What about usage policies and security?",
    answer:
      "Gigaviz enforces usage policies, access controls, and auditing to maintain security and prevent abuse.",
  },
];

export default function GetStartedPage() {
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

          <div className="container relative z-10 grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Get Started
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Get Started with Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Choose the fastest way to join the ecosystem: Individual or Team (Workspace).
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <TrackedLink
                  href="/login?next=/onboarding"
                  label="Buat Akun"
                  location="get_started_hero"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Create an Account
                </TrackedLink>
                <TrackedLink
                  href="/dashboard"
                  label="Masuk"
                  location="get_started_hero"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Sign In
                </TrackedLink>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-sm text-[color:var(--gv-muted)]">
                Specific features unlock based on your subscription plan. Token costs (AI/WhatsApp API) are calculated separately based on usage.
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Onboarding Summary
              </div>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--gv-text)]">
                Join the ecosystem in a few steps
              </h2>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                Choose your plan, complete your account, then activate modules based on your needs.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-[color:var(--gv-muted)]">
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Choose Individual or Team (Workspace).</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Complete your account and verify your email.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Activate modules, billing, and tokens based on your plan.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <GetStartedFunnel />

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                What You Get
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Core features comparison
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Modules and access are customized based on your chosen plan.
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[color:var(--gv-muted)]">
                  <thead className="bg-[color:var(--gv-surface)] text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                    <tr>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        Feature
                      </th>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        Individual
                      </th>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        Team (Workspace)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.label} className="border-t border-[color:var(--gv-border)]">
                        <td className="px-5 py-4 font-semibold text-[color:var(--gv-text)]">
                          {row.label}
                        </td>
                        <td className="px-5 py-4">
                          {row.planned ? (
                            <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                              Coming Soon
                            </span>
                          ) : (
                            row.individu
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {row.planned ? (
                            <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                              Coming Soon
                            </span>
                          ) : (
                            row.tim
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Trust & safety
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Security remains our priority
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  We establish security foundations from the start of onboarding to keep the ecosystem safe as it grows.
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-3 text-sm text-[color:var(--gv-muted)]">
                  {trustPoints.map((item) => (
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
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
              {faqItems.map((item) => (
                <div
                  key={item.question}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Ready to get started?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Create an account to choose your plan, then review pricing details if needed.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <TrackedLink
                  href="/login?next=/onboarding"
                  label="Buat Akun"
                  location="get_started_footer"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Create an Account
                </TrackedLink>
                <TrackedLink
                  href="/pricing"
                  label="Lihat Pricing"
                  location="get_started_footer"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Pricing
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


