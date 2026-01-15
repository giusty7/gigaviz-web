import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EcosystemGraph } from "@/components/marketing/ecosystem-graph";
import { TrustBadge } from "@/components/marketing/trust-badge";
import { TrustConsole } from "@/components/marketing/trust-console";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";
import { moduleStatusLabel, topLevelModules } from "@/lib/modules/catalog";
import TrackedLink from "@/components/analytics/tracked-link";

export const metadata: Metadata = {
  title: "Gigaviz Ecosystem — Technology Provider for WhatsApp Business Platform",
  description:
    "Technology Provider — WhatsApp Business Platform. Built on the official Cloud API with Gigaviz Ecosystem modules for messaging, AI, and operations.",
};

const steps = [
  { title: "Create", desc: "Build content, templates, and brand assets at scale." },
  { title: "Automate", desc: "Automate workflows, messaging, and approvals." },
  { title: "Monetize", desc: "Manage Billing, invoices, payments, and subscriptions." },
  { title: "Manage", desc: "Control Audit Logs, Roles, and Token Usage in one place." },
];

const moduleShortOverrides: Record<string, string> = {
  platform: "Core OS for accounts, Workspaces, Billing, Roles, and Audit Logs.",
  meta_hub: "Live: WhatsApp Business Platform onboarding, templates, inbox, delivery checks.",
  helper: "AI assistant for chat, copy, and summaries.",
  studio: "Parent suite for Office, Graph, and Tracks.",
  apps: "App catalog, requests, ticketing, and roadmap.",
  marketplace: "Marketplace for templates, prompt packs, assets, and mini-apps.",
  arena: "Engagement games for brands and communities.",
  pay: "Wallet and billing: invoices, payment links, subscriptions.",
  community: "Community hub for feedback, showcases, and events.",
  trade: "Market insights and trading workflows.",
};

const complianceItems = [
  {
    title: "Official API Foundation",
    desc: "Built on WhatsApp Business Platform (Cloud API) for structured messaging workflows.",
  },
  {
    title: "Onboarding Flow for Customers",
    desc: "Streamline onboarding to WhatsApp Business Platform through our Technology Provider flow.",
  },
  {
    title: "Team-Ready by Design",
    desc: "Workspaces, access control, and activity visibility designed for operational clarity.",
  },
];

const integrationCategories = [
  {
    title: "Messaging",
    items: ["WhatsApp Business Platform (Cloud API)"],
  },
  {
    title: "AI",
    items: ["OpenAI", "Google Gemini", "Anthropic Claude", "Ollama"],
  },
  {
    title: "Backend & Email",
    items: ["Supabase", "Resend"],
  },
  {
    title: "Deployment & Stack",
    items: ["Vercel", "Next.js", "GitHub", "Turbopack"],
  },
  {
    title: "Domain",
    items: ["Squarespace Domains (Registrar)"],
  },
];

const timelineItems = [
  {
    title: "Meta Hub Technology Provider Gateway",
    status: "Live",
    detail: "Technology Provider onboarding, templates, inbox, and delivery status.",
    accent: "emerald",
  },
  {
    title: "Helper AI",
    status: "In progress",
    detail: "AI assistance and orchestration aligned with workspace controls.",
    accent: "cyan",
  },
  {
    title: "Studio (Office / Graph / Tracks)",
    status: "Planned",
    detail: "Creative and data workflows on the same control plane.",
    accent: "violet",
  },
  {
    title: "Community & Advanced RBAC",
    status: "Planned",
    detail: "Deeper roles, community modules, and governance upgrades.",
    accent: "amber",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border hero-gradient text-foreground">
          {/* Cinematic aurora glows - brighter magenta emphasis */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[5%] top-[0%] h-[520px] w-[520px] rounded-full bg-gigaviz-gold/30 blur-[160px]" />
            <div className="absolute right-[-5%] top-[10%] h-[480px] w-[480px] rounded-full bg-gigaviz-magenta/35 blur-[140px]" />
            <div className="absolute bottom-[-15%] left-1/3 h-[360px] w-[560px] rounded-full bg-gigaviz-magenta/15 blur-[120px]" />
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gigaviz-cream/5 blur-[100px]" />
          </div>
          {/* Batik-inspired etched motif overlay */}
          <div className="pointer-events-none absolute inset-0 batik-pattern [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,white,transparent)]" aria-hidden />

          <div className="container relative z-10 grid gap-12 py-20 lg:grid-cols-[1fr_1fr] md:py-24 lg:py-28">
            <div className="space-y-7">
              {/* Badge row - cream trust pill with spark */}
              <div className="flex flex-wrap items-center gap-3">
                <TrustBadge />
                <span className="inline-flex h-9 items-center rounded-full border border-gigaviz-cream/20 bg-gigaviz-surface/70 px-4 text-[11px] text-gigaviz-cream backdrop-blur-lg">
                  Onboarding completed (2/2 steps)
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="max-w-xl text-balance text-3xl font-gvDisplay font-semibold leading-tight tracking-tight text-gigaviz-cream md:text-4xl lg:text-[2.85rem]">
                  The Unified Infrastructure for Scalable Digital Ventures
                </h1>
                <p className="max-w-lg text-pretty text-sm leading-relaxed text-gigaviz-muted md:text-base">
                  Built on the official WhatsApp Business Platform (Cloud API). Gigaviz Ecosystem modules (Core OS + Meta Hub + Helper + Studio) share auth, billing, audit logs, and access control.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <TrackedLink
                  href="/get-started"
                  label="Get Started"
                  location="homepage_hero"
                  className="inline-flex items-center justify-center rounded-2xl bg-gigaviz-gold px-7 py-3.5 text-sm font-semibold text-gigaviz-navy shadow-[0_8px_32px_-8px_var(--gv-gold)] transition hover:bg-gigaviz-gold-bright hover:shadow-[0_12px_40px_-8px_var(--gv-gold)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Get Started
                </TrackedLink>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-2xl border border-gigaviz-cream/20 bg-gigaviz-surface/60 px-7 py-3.5 text-sm font-semibold text-gigaviz-cream backdrop-blur-lg transition hover:border-gigaviz-gold/40 hover:bg-gigaviz-surface/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  See How It Works
                </Link>
              </div>

              {/* Feature tags - subtle pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "Gigaviz Ecosystem",
                  "WhatsApp Cloud API",
                  "Policy-Aligned Messaging",
                  "Audit & Token Usage",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gigaviz-cream/10 bg-gigaviz-surface/50 px-3 py-1.5 text-gigaviz-muted backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center lg:justify-center">
              <EcosystemGraph />
            </div>
          </div>
        </section>

        {/* Trust Console - Premium Status Strip */}
        <TrustConsole />

        <section id="how-it-works" className="border-b border-border bg-gradient-to-b from-gigaviz-bg via-gigaviz-surface/30 to-gigaviz-bg">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gigaviz-gold">Workflow</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-gigaviz-cream md:text-3xl">
                  How It Works
                </h2>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-gigaviz-gold hover:underline"
              >
                View all modules
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="glass-premium console-border rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gigaviz-gold/15 text-sm font-bold text-gigaviz-gold">
                      {index + 1}
                    </div>
                    <h3 className="text-base font-semibold text-gigaviz-cream">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-gigaviz-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-gradient-to-b from-gigaviz-bg via-gigaviz-surface/30 to-gigaviz-bg">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gigaviz-gold">
                  Ecosystem Modules
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-gigaviz-cream md:text-3xl">
                  Modules ready for your team
                </h2>
                <p className="mt-2 max-w-xl text-sm text-gigaviz-muted">
                  Core OS (Live), Meta Hub (Technology Provider, Live), Helper (in progress), Studio
                  and Office/Graph/Tracks (coming soon) run on the same workspace, billing, and audit
                  foundation.
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-gigaviz-gold hover:underline"
              >
                View all modules
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topLevelModules.map((module) => {
                const short = moduleShortOverrides[module.key] ?? module.short;
                const isHelper = module.key === "helper";
                return (
                  <Link
                    key={module.slug}
                    href={module.hrefMarketing ?? `/products/${module.slug}`}
                    className={`group flex h-full flex-col justify-between rounded-2xl p-5 transition hover:-translate-y-1 glass-premium console-border ${
                      isHelper 
                        ? "border-gigaviz-magenta/25 hover:shadow-[0_16px_48px_-12px_var(--gv-magenta)]" 
                        : "hover:border-gigaviz-gold/40 hover:shadow-[0_16px_48px_-12px_var(--gv-gold)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`grid h-11 w-11 place-items-center rounded-xl ${isHelper ? "bg-gigaviz-magenta/15" : "bg-gigaviz-gold/15"}`}>
                        <MarketingIcon name={module.icon} className={`h-5 w-5 ${isHelper ? "text-gigaviz-magenta" : "text-gigaviz-gold"}`} />
                      </div>
                      <StatusBadge status={module.status} />
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <h3 className="text-base font-semibold text-gigaviz-cream">{module.name}</h3>
                      <p className="text-sm text-gigaviz-muted">{short}</p>
                    </div>
                    <div className={`mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] ${isHelper ? "text-gigaviz-magenta" : "text-gigaviz-gold"}`}>
                      {moduleStatusLabel[module.status]}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-gigaviz-surface/50">
          <div className="container py-16 md:py-20">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-gigaviz-gold">
                Security by design
              </p>
              <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-gigaviz-cream md:text-3xl">
                Built for workspace isolation and governance
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "RLS & Isolation", desc: "Row-level security per workspace for all data." },
                {
                  title: "Audit Logs",
                  desc: "Critical events are recorded for review and compliance.",
                },
                {
                  title: "Rate limiting",
                  desc: "Built-in abuse protection for sensitive endpoints.",
                },
                {
                  title: "Workspace isolation",
                  desc: "Token Usage, Billing, and entitlements are scoped per workspace.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-dark rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-gigaviz-cream">{item.title}</h3>
                  <p className="mt-2 text-sm text-gigaviz-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-gigaviz-bg">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gigaviz-gold">
                  Compliance Standards
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-gigaviz-cream md:text-3xl">
                  Designed for policy-aligned messaging workflows
                </h2>
              </div>
              <Link href="/trust" className="text-sm font-semibold text-gigaviz-gold hover:underline">
                View verification
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {complianceItems.map((item) => (
                <div key={item.title} className="glass-premium console-border rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-gigaviz-cream">{item.title}</h3>
                  <p className="mt-2 text-sm text-gigaviz-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-gigaviz-surface/40">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gigaviz-gold">Integrations</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-gigaviz-cream md:text-3xl">
                  Connected tools for teams
                </h2>
                <p className="mt-2 max-w-lg text-sm text-gigaviz-muted">
                  Works with your messaging stack, AI providers, data, and deployment tooling. No implied partnerships — just integrations.
                </p>
              </div>
              <Link
                href="/integrations"
                className="text-sm font-semibold text-gigaviz-gold hover:underline"
              >
                View all integrations
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrationCategories.map((category) => (
                <div key={category.title} className="glass-dark rounded-2xl p-5">
                  <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-gigaviz-gold">
                    {category.title}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="inline-flex h-6 items-center rounded-full border border-gigaviz-cream/15 bg-gigaviz-surface/80 px-2.5 text-[10px] font-medium text-gigaviz-cream"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] text-gigaviz-muted/80">
              WhatsApp, Meta, and other trademarks are the property of their respective owners. Integrations do not imply affiliation or endorsement.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-gigaviz-bg">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gigaviz-gold">Roadmap</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-gigaviz-cream md:text-3xl">
                  Delivery timeline
                </h2>
              </div>
              <Link href="/roadmap" className="text-sm font-semibold text-gigaviz-gold hover:underline">
                View roadmap
              </Link>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-2xl glass-premium console-border p-6">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-gigaviz-gold/30 to-transparent" aria-hidden />
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                {timelineItems.map((item, index) => (
                  <div key={item.title} className="relative flex flex-col gap-2">
                    <span
                      className={
                        "absolute left-1/2 top-[-18px] h-3 w-3 -translate-x-1/2 rounded-full " +
                        (index === 0
                          ? "bg-gigaviz-gold shadow-[0_0_16px_var(--gv-gold)]"
                          : "bg-gigaviz-cream/60 shadow-[0_0_12px_rgba(255,255,255,0.25)]")
                      }
                      aria-hidden
                    />
                    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-gigaviz-muted">
                      {index === 0 ? "Completed" : item.status}
                    </div>
                    <div className="text-sm font-semibold text-gigaviz-cream">{item.title}</div>
                    <p className="text-sm text-gigaviz-muted">{item.detail}</p>
                    {index === 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gigaviz-gold">
                        <span className="h-2 w-2 rounded-full bg-gigaviz-gold shadow-[0_0_10px_var(--gv-gold)]" />
                        Live
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[10px] text-gigaviz-muted/80">
              BSP/Partner listing remains planned. No guarantees are implied; timelines may change.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-gradient-to-b from-gigaviz-bg via-gigaviz-surface/30 to-gigaviz-bg">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gigaviz-gold">Pricing</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-gigaviz-cream md:text-3xl">
                  Plans plus usage-based tokens
                </h2>
              </div>
              <Link
                href="/pricing"
                className="text-sm font-semibold text-gigaviz-gold hover:underline"
              >
                View pricing
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  name: "Free Locked",
                  price: "Rp0",
                  desc: "Limited access for internal evaluation.",
                  badge: "AVAILABLE",
                  featured: false,
                },
                {
                  name: "Individual",
                  price: "Contact sales",
                  desc: "Solo operators with pay-as-you-go Token Usage.",
                  badge: "COMING SOON",
                  featured: true,
                },
                {
                  name: "Team",
                  price: "Contact sales",
                  desc: "Collaborative teams with entitlements, seats, and custom token caps.",
                  badge: "COMING SOON",
                  featured: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-5 glass-premium console-border ${
                    plan.featured 
                      ? "border-gigaviz-gold/30 shadow-[0_0_24px_-6px_var(--gv-gold)]" 
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gigaviz-cream">{plan.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase ${
                      plan.badge === "AVAILABLE" 
                        ? "bg-green-500/15 text-green-600" 
                        : plan.featured ? "bg-gigaviz-gold/20 text-gigaviz-gold" : "bg-gigaviz-surface text-gigaviz-muted"
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                  <div className="mt-3 text-xl font-semibold text-gigaviz-gold">{plan.price}</div>
                  <p className="mt-2 text-sm text-gigaviz-muted">{plan.desc}</p>
                  <Link
                    href="/get-started"
                    className={`mt-4 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      plan.featured 
                        ? "bg-gigaviz-gold text-gigaviz-navy shadow-[0_4px_16px_-4px_var(--gv-gold)] hover:bg-gigaviz-gold-bright" 
                        : "border border-gigaviz-cream/20 bg-gigaviz-surface/60 text-gigaviz-cream hover:border-gigaviz-gold/50"
                    }`}
                  >
                    Choose plan
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-gigaviz-bg">
          <div className="container py-16 md:py-20">
            <div className="relative overflow-hidden rounded-2xl glass-premium console-border p-8 md:flex md:items-center md:justify-between">
              {/* Subtle gradient overlay */}
              <div 
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, hsla(42 62% 62% / 0.1) 0%, transparent 50%, hsla(323 70% 60% / 0.05) 100%)"
                }}
                aria-hidden
              />
              <div className="relative space-y-2">
                <h2 className="text-2xl font-gvDisplay font-semibold text-gigaviz-cream">Ready for onboarding</h2>
                <p className="max-w-md text-sm text-gigaviz-muted">
                  Technology Provider — WhatsApp Business Platform. Unlock modules with subscriptions; power AI and API actions with token usage.
                </p>
              </div>
              <div className="relative mt-6 flex flex-wrap gap-3 md:mt-0">
                <TrackedLink
                  href="/get-started"
                  label="Get Started"
                  location="homepage_footer"
                  className="inline-flex items-center justify-center rounded-xl bg-gigaviz-gold px-6 py-3 text-sm font-semibold text-gigaviz-navy shadow-[0_8px_32px_-8px_var(--gv-gold)] transition hover:bg-gigaviz-gold-bright hover:shadow-[0_12px_40px_-8px_var(--gv-gold)]"
                >
                  Request onboarding
                </TrackedLink>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-gigaviz-cream/20 bg-gigaviz-surface/60 px-6 py-3 text-sm font-semibold text-gigaviz-cream backdrop-blur transition hover:border-gigaviz-gold/50"
                >
                  Contact sales
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
