import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { EcosystemGraph } from "@/components/marketing/ecosystem-graph";
import { TrustConsole } from "@/components/marketing/trust-console";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";
import { moduleStatusLabel, topLevelModules } from "@/lib/modules/catalog";
import TrackedLink from "@/components/analytics/tracked-link";
import { getAppContext } from "@/lib/app-context";

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

export default async function HomePage() {
  const ctx = await getAppContext();
  if (ctx.user) {
    if (!ctx.currentWorkspace) {
      redirect("/onboarding");
    }
    redirect(`/${ctx.currentWorkspace.slug}/dashboard`);
  }

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-[#d4af37]/15 hero-gradient text-[#f5f5dc]">
          {/* Constellation pattern overlay */}
          <div className="pointer-events-none absolute inset-0 constellation-pattern opacity-60" aria-hidden />
          {/* Cinematic aurora glows - Gold & Magenta emphasis */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[5%] top-[0%] h-[520px] w-[520px] rounded-full bg-[#d4af37]/20 blur-[160px]" />
            <div className="absolute right-[-5%] top-[10%] h-[480px] w-[480px] rounded-full bg-[#e11d48]/25 blur-[140px]" />
            <div className="absolute bottom-[-15%] left-1/3 h-[360px] w-[560px] rounded-full bg-[#e11d48]/10 blur-[120px]" />
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5f5dc]/3 blur-[100px]" />
          </div>
          {/* Batik-inspired etched motif overlay */}
          <div className="pointer-events-none absolute inset-0 batik-pattern [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,white,transparent)]" aria-hidden />

          <div className="container relative z-10 py-20 md:py-24 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-7">
              {/* Verified Badge - Left aligned */}
              <div className="flex">
                <span className="group inline-flex items-center gap-2.5 rounded-full border border-[#d4af37]/30 bg-[#0a1229]/80 px-5 py-2.5 text-sm font-medium text-[#f5f5dc] shadow-[0_0_24px_-4px_rgba(212,175,55,0.35)] backdrop-blur-xl animate-pulse-slow">
                  <BadgeCheck 
                    className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" 
                    strokeWidth={2.5}
                  />
                  <span>Official Meta Verified Technology Provider</span>
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="max-w-xl text-balance text-3xl font-gvDisplay font-semibold leading-tight tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent md:text-4xl lg:text-[2.85rem]">
                  The Unified Digital Infrastructure for Enterprise Growth.
                </h1>
                <p className="max-w-lg text-pretty text-sm leading-relaxed text-[#f5f5dc]/75 md:text-base">
                  One secure identity to rule 10 interconnected powerhouses—from official Meta messaging hubs to AI workflows and creative studios. Centralized auth, billing, and control for your entire operation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <TrackedLink
                  href="/get-started"
                  label="Explore the Imperium"
                  location="homepage_hero"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-7 py-3.5 text-sm font-semibold text-[#050a18] shadow-[0_8px_32px_-8px_rgba(212,175,55,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.7)] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a18]"
                >
                  Explore the Imperium
                </TrackedLink>
                <Link
                  href="#ecosystem"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[#0a1229]/60 px-7 py-3.5 text-sm font-semibold text-[#d4af37] backdrop-blur-lg transition hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10 focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a18]"
                >
                  View Ecosystem Demo
                </Link>
              </div>

              {/* Feature tags - subtle Gold pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "10 Unified Pillars",
                  "Meta Verified",
                  "AI Workflows",
                  "Centralized Billing",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#d4af37]/15 bg-[#0a1229]/50 px-3 py-1.5 text-[#f5f5dc]/60 backdrop-blur-sm"
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
          </div>
        </section>

        {/* Trust Console - Premium Status Strip */}
        <TrustConsole />

        <section id="how-it-works" className="border-b border-[#d4af37]/15 bg-[#050a18]">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Workflow</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  How It Works
                </h2>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors"
              >
                View all modules
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="glass-imperium rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/10 text-lg font-bold text-[#d4af37] shadow-[0_0_20px_-4px_rgba(212,175,55,0.3)]">
                      {index + 1}
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f5dc]">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-[#f5f5dc]/65">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d4af37]/15 bg-[#050a18]">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                  Ecosystem Modules
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  Modules ready for your team
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#f5f5dc]/65">
                  Core OS (Live), Meta Hub (Technology Provider, Live), Helper (in progress), Studio
                  and Office/Graph/Tracks (coming soon) run on the same workspace, billing, and audit
                  foundation.
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors"
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
                    className={`group flex h-full flex-col justify-between rounded-2xl p-5 transition hover:-translate-y-1 glass-imperium ${
                      isHelper 
                        ? "border-[#e11d48]/25 hover:border-[#e11d48]/50 hover:shadow-[0_0_24px_-6px_rgba(225,29,72,0.3)]" 
                        : "hover:border-[#d4af37]/40 hover:shadow-[0_0_24px_-6px_rgba(212,175,55,0.3)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`grid h-11 w-11 place-items-center rounded-xl ${isHelper ? "bg-[#e11d48]/15" : "bg-[#d4af37]/15"}`}>
                        <MarketingIcon name={module.icon} className={`h-5 w-5 ${isHelper ? "text-[#e11d48]" : "text-[#d4af37]"}`} />
                      </div>
                      <StatusBadge status={module.status} />
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <h3 className="text-base font-semibold text-[#f5f5dc]">{module.name}</h3>
                      <p className="text-sm text-[#f5f5dc]/65">{short}</p>
                    </div>
                    <div className={`mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] ${isHelper ? "text-[#e11d48]" : "text-[#d4af37]"}`}>
                      {moduleStatusLabel[module.status]}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d4af37]/15 bg-[#0a1229]/50">
          <div className="container py-16 md:py-20">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                Security by design
              </p>
              <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
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
                <div key={item.title} className="glass-imperium rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-[#f5f5dc]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#f5f5dc]/65">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d4af37]/15 bg-[#050a18]">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                  Compliance Standards
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  Designed for policy-aligned messaging workflows
                </h2>
              </div>
              <Link href="/trust" className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors">
                View verification
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {complianceItems.map((item) => (
                <div key={item.title} className="glass-imperium rounded-2xl p-5 transition-all duration-300 hover:border-[#d4af37]/40">
                  <h3 className="text-sm font-semibold text-[#f5f5dc]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#f5f5dc]/65">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#d4af37]/15 bg-[#0a1229]/50">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Integrations</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  Connected tools for teams
                </h2>
                <p className="mt-2 max-w-lg text-sm text-[#f5f5dc]/65">
                  Works with your messaging stack, AI providers, data, and deployment tooling. No implied partnerships — just integrations.
                </p>
              </div>
              <Link
                href="/integrations"
                className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors"
              >
                View all integrations
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrationCategories.map((category) => (
                <div key={category.title} className="glass-imperium rounded-2xl p-5 transition-all duration-300 hover:border-[#d4af37]/40">
                  <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#d4af37]">
                    {category.title}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="inline-flex h-6 items-center rounded-full border border-[#d4af37]/20 bg-[#050a18]/80 px-2.5 text-[10px] font-medium text-[#f5f5dc]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] text-[#f5f5dc]/50">
              WhatsApp, Meta, and other trademarks are the property of their respective owners. Integrations do not imply affiliation or endorsement.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-gigaviz-bg">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Roadmap</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  Delivery timeline
                </h2>
              </div>
              <Link href="/roadmap" className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors">
                View roadmap
              </Link>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-2xl glass-imperium p-6">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" aria-hidden />
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                {timelineItems.map((item, index) => (
                  <div key={item.title} className="relative flex flex-col gap-2">
                    <span
                      className={
                        "absolute left-1/2 top-[-18px] h-3 w-3 -translate-x-1/2 rounded-full " +
                        (index === 0
                          ? "bg-[#d4af37] shadow-[0_0_16px_#d4af37]"
                          : "bg-[#f5f5dc]/60 shadow-[0_0_12px_rgba(245,245,220,0.25)]")
                      }
                      aria-hidden
                    />
                    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#f5f5dc]/50">
                      {index === 0 ? "Completed" : item.status}
                    </div>
                    <div className="text-sm font-semibold text-[#f5f5dc]">{item.title}</div>
                    <p className="text-sm text-[#f5f5dc]/65">{item.detail}</p>
                    {index === 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#d4af37]">
                        <span className="h-2 w-2 rounded-full bg-[#d4af37] shadow-[0_0_10px_#d4af37]" />
                        Live
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[10px] text-[#f5f5dc]/50">
              BSP/Partner listing remains planned. No guarantees are implied; timelines may change.
            </p>
          </div>
        </section>

        <section className="border-b border-[#d4af37]/15 bg-gradient-to-b from-[#050a18] via-[#0a1229]/40 to-[#050a18]">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Pricing</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  Plans plus usage-based tokens
                </h2>
              </div>
              <Link
                href="/pricing"
                className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors"
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
                  className={`rounded-2xl p-5 glass-imperium transition-all duration-300 ${
                    plan.featured 
                      ? "ring-2 ring-[#d4af37]/50 shadow-[0_0_32px_-8px_#d4af37]" 
                      : "hover:border-[#d4af37]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[#f5f5dc]">{plan.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase ${
                      plan.badge === "AVAILABLE" 
                        ? "bg-green-500/15 text-green-500" 
                        : plan.featured ? "bg-[#d4af37]/20 text-[#d4af37]" : "bg-[#0a1229] text-[#f5f5dc]/50"
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                  <div className="mt-3 text-xl font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">{plan.price}</div>
                  <p className="mt-2 text-sm text-[#f5f5dc]/65">{plan.desc}</p>
                  <Link
                    href="/get-started"
                    className={`mt-4 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      plan.featured 
                        ? "bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] shadow-[0_4px_20px_-4px_#d4af37] hover:shadow-[0_8px_28px_-4px_#d4af37]" 
                        : "border border-[#f5f5dc]/20 bg-[#0a1229]/60 text-[#f5f5dc] hover:border-[#d4af37]/50"
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
        <section className="bg-[#050a18]">
          <div className="container py-16 md:py-20">
            <div className="relative overflow-hidden rounded-2xl glass-imperium p-8 md:flex md:items-center md:justify-between">
              {/* Rich gold-to-magenta gradient overlay */}
              <div 
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, transparent 50%, rgba(225, 29, 72, 0.08) 100%)"
                }}
                aria-hidden
              />
              <div className="relative space-y-2">
                <h2 className="text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">Ready for onboarding</h2>
                <p className="max-w-md text-sm text-[#f5f5dc]/65">
                  Technology Provider — WhatsApp Business Platform. Unlock modules with subscriptions; power AI and API actions with token usage.
                </p>
              </div>
              <div className="relative mt-6 flex flex-wrap gap-3 md:mt-0">
                <TrackedLink
                  href="/get-started"
                  label="Get Started"
                  location="homepage_footer"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-6 py-3 text-sm font-semibold text-[#050a18] shadow-[0_8px_32px_-8px_#d4af37] transition hover:shadow-[0_12px_40px_-8px_#d4af37]"
                >
                  Request onboarding
                </TrackedLink>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-[#f5f5dc]/20 bg-[#0a1229]/60 px-6 py-3 text-sm font-semibold text-[#f5f5dc] backdrop-blur transition hover:border-[#d4af37]/50"
                >
                  Contact sales
                </Link>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
