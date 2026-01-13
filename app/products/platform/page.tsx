import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";

export const metadata: Metadata = {
  title: "Gigaviz Platform (Core OS)",
  description:
    "Foundation of the Gigaviz ecosystem for accounts, workspaces, billing, roles, and audit. Indonesia-first, ready for global scale.",
  openGraph: {
    title: "Gigaviz Platform (Core OS)",
    description:
      "Foundation of the Gigaviz ecosystem for accounts, workspaces, billing, roles, and audit. Indonesia-first, ready for global scale.",
    url: "/products/platform",
  },
};

const coreHighlights = [
  {
    title: "Single identity",
    desc: "One account to access all modules without switching logins.",
  },
  {
    title: "Shared workspace",
    desc: "Consistent organizational structure, projects, and teams across all modules.",
  },
  {
    title: "One dashboard",
    desc: "Control billing, security, and team activity in a single view.",
  },
];

const featureCards = [
  {
    title: "Account & SSO",
    desc: "User registration, identity management, and single sign-on for secure login flows.",
  },
  {
    title: "Workspace",
    desc: "Manage organizations, projects, and team structures across units for focused collaboration.",
  },
  {
    title: "Billing",
    desc: "Subscription plans, invoices, and cost control per workspace for clear spending.",
  },
  {
    title: "Roles & Permissions",
    desc: "RBAC for Owner, Admin, Member, and Viewer with granular access control.",
  },
  {
    title: "Settings & Audit Log",
    desc: "Preferences, usage limits, and activity trails for security needs.",
  },
];

const rbacRoles = [
  {
    role: "Owner",
    access: "Manage organization, billing, and security policies.",
  },
  {
    role: "Admin",
    access: "Set up workspace, users, and operational integrations.",
  },
  {
    role: "Member",
    access: "Run modules according to tasks and create project data.",
  },
  {
    role: "Viewer",
    access: "Read reports and audit logs without change access.",
  },
];

const auditEvents = [
  "Successful or failed login",
  "Workspace created, archived, or restored",
  "New user invitations sent",
  "Role and permission changes",
  "Subscription plan updated",
  "Invoice created or paid",
  "Token limit per workspace changed",
  "API key created or revoked",
];

const securityPosture = [
  {
    title: "Least privilege + RLS",
    desc: "Data access follows roles and workspaces, defaulting to the lowest level.",
  },
  {
    title: "Audit-ready",
    desc: "Every important activity is logged for review and compliance.",
  },
  {
    title: "Data separation",
    desc: "Data is isolated per workspace to prevent cross-access.",
  },
];

const modules = [
  "Meta Hub",
  "Helper",
  "Office",
  "Studio (Graph + Tracks)",
  "Marketplace",
  "Arena",
  "Apps",
  "Pay",
  "Community",
];

export default function PlatformProductPage() {
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                Core OS Gigaviz
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Platform (Core OS)
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  The foundation of identity, workspace, and billing for the entire ecosystem. Indonesia-first, ready for global scale.
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
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] bg-transparent px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Pricing
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Single sign-on
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Multi-workspace
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Centralized billing
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                    Core OS Overview
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-[color:var(--gv-text)]">
                    All foundations in one module
                  </h2>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    Gigaviz Platform is the source of identity, workspace, and billing for all modules.
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
                  <MarketingIcon
                    name="platform"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-[color:var(--gv-muted)]">
                {featureCards.map((feature) => (
                  <li key={feature.title} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{feature.title}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-xs text-[color:var(--gv-muted)]">
                Core OS runs before other modules activate, ensuring consistent team onboarding.
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                What Core OS does
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Single identity, shared workspace, one dashboard.
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Core OS unifies team data, organizational structure, and access control so every module runs on the same foundation.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {coreHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Core Features
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Core modules that keep the ecosystem organized
                </h2>
              </div>
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
            <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  RBAC table
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Clear roles, secure access
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Role-based access control ensures each team member only accesses the features they need.
                </p>
              </div>
              <div className="overflow-hidden rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[color:var(--gv-muted)]">
                    <thead className="bg-[color:var(--gv-surface)] text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                      <tr>
                        <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                          Role
                        </th>
                        <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                          Example permissions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rbacRoles.map((item) => (
                        <tr key={item.role} className="border-t border-[color:var(--gv-border)]">
                          <td className="px-5 py-4 font-semibold text-[color:var(--gv-text)]">
                            {item.role}
                          </td>
                          <td className="px-5 py-4">{item.access}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Audit log example
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Important activities are always recorded
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Audit logs help teams monitor important changes and maintain accountability.
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {auditEvents.map((event) => (
                    <li key={event} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                      <span>{event}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Security posture
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Audit-ready security
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {securityPosture.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-center">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Connected with other modules
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Foundation for all Gigaviz modules
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Core OS is the connector for account, workspace, and billing across the ecosystem.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {modules.map((module) => (
                  <span
                    key={module}
                    className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--gv-text)]"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Ready to unify your ecosystem?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Start with Core OS to ensure all modules run on the same foundation.
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

      <Footer />
    </div>
  );
}
