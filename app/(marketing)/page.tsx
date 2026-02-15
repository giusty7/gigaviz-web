import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";
import { LatestUpdates } from "@/components/marketing/LatestUpdates";
import { TestimonialsSection } from "@/components/marketing/testimonials";
import { NewsletterCapture } from "@/components/marketing/newsletter-capture";
import { moduleStatusLabel, topLevelModules } from "@/lib/modules/catalog";
import TrackedLink from "@/components/analytics/tracked-link";
import { getAppContext } from "@/lib/app-context";
import { getTranslations } from "next-intl/server";

/* ── Lazy-loaded heavy client components ─────────────────────── */
const EcosystemOrbital = dynamic(
  () =>
    import("@/components/marketing/EcosystemOrbital").then(
      (m) => m.EcosystemOrbital,
    ),
  { loading: () => <div className="h-[320px] animate-pulse rounded-xl bg-[color:var(--gv-surface)]" /> },
);

const TrustConsole = dynamic(
  () =>
    import("@/components/marketing/trust-console").then(
      (m) => m.TrustConsole,
    ),
  { loading: () => <div className="h-[200px] animate-pulse rounded-xl bg-[color:var(--gv-surface)]" /> },
);

export const metadata: Metadata = {
  title: "Gigaviz — All-in-One Business Platform for WhatsApp, AI & Operations",
  description:
    "Everything your business needs — from WhatsApp Business API to AI assistants — in one workspace with built-in billing and audit.",
};

// Suites are resolved inside the component with translations

const moduleShortOverrides: Record<string, string> = {
  platform: "Authentication, roles, billing, audit trails, and workspace management for your entire team.",
  meta_hub: "Official WhatsApp Cloud API with templates, unified inbox, delivery tracking, and automation.",
  helper: "AI assistant for smart replies, copywriting, summaries, and CRM insights.",
  links: "Smart bio pages, QR codes, click-to-WhatsApp links, and conversion tracking.",
  studio: "AI-powered creative suite for documents, images, and audio content.",
  apps: "Third-party integrations and custom tools to extend your workspace.",
  marketplace: "Buy and sell templates, prompt packs, and digital assets.",
};

const complianceItems = [
  {
    title: "Official Meta Cloud API",
    desc: "All messaging runs through the verified Technology Provider flow with delivery checks.",
  },
  {
    title: "Policy-aligned templates",
    desc: "Template creation, review, approvals, and delivery tracking live in one workspace.",
  },
  {
    title: "Operational clarity",
    desc: "Membership, roles, and audit ensure teams know who sent what and why.",
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
    title: "Meta Hub + Platform",
    status: "Live",
    detail: "WhatsApp Business API, unified inbox, contacts, templates, billing, and team management.",
    accent: "emerald",
  },
  {
    title: "Helper AI + CRM",
    status: "In progress",
    detail: "AI assistant for smart replies, lead insights, knowledge base, and workflow automation.",
    accent: "cyan",
  },
  {
    title: "Studio (Office / Graph / Tracks)",
    status: "Planned",
    detail: "AI-powered document generation, image creation, and audio production.",
    accent: "violet",
  },
  {
    title: "Marketplace & Apps",
    status: "Planned",
    detail: "Buy/sell digital products, templates, and integrate third-party tools.",
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

  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const suites = [
    { title: t("suiteGrowth"), desc: t("suiteGrowthDesc") },
    { title: t("suiteBuild"), desc: t("suiteBuildDesc") },
    { title: t("suiteCommunity"), desc: t("suiteCommunityDesc") },
  ];

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
                  <span>{t("badge")}</span>
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="max-w-xl text-balance text-3xl font-gvDisplay font-semibold leading-tight tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent md:text-4xl lg:text-[2.85rem]">
                  {t("heroTitle")}
                </h1>
                <p className="max-w-lg text-pretty text-sm leading-relaxed text-[#f5f5dc]/75 md:text-base">
                  {t("heroDescription")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <TrackedLink
                  href="/get-started"
                  label={t("ctaOnboarding")}
                  location="homepage_hero"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-7 py-3.5 text-sm font-semibold text-[#050a18] shadow-[0_8px_32px_-8px_rgba(212,175,55,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.7)] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a18]"
                >
                  {t("ctaOnboarding")}
                </TrackedLink>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[#0a1229]/60 px-7 py-3.5 text-sm font-semibold text-[#d4af37] backdrop-blur-lg transition hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10 focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a18]"
                >
                  {t("ctaOverview")}
                </Link>
              </div>

              {/* Feature tags - subtle Gold pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  t("tagMetaVerified"),
                  t("tagRooms"),
                  t("tagWorkspace"),
                  t("tagAudit"),
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

            {/* Orbital Visual - compact, aligned with left content */}
            <div className="relative flex items-start justify-center lg:items-center">
              <EcosystemOrbital />
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
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Pillars</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  {t("suitesTitle")}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#f5f5dc]/65">
                  Connect, Create, and Commerce — three pillars on one verified platform with workspace isolation, billing, and audit built in.
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors"
              >
                View all products
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suites.map((step, index) => (
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
                  Ecosystem Products
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  Products ready to launch
                </h2>
                <p className="mt-2 max-w-xl text-sm text-[#f5f5dc]/65">
                  Each product belongs to Connect, Create, or Commerce and inherits the same identity, billing, and audit controls from Platform.
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors"
              >
                View all products
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
                Security and tenancy by default
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "RLS everywhere",
                  desc: "Row-level security per workspace for data, tokens, and billing events.",
                },
                {
                  title: "Least privilege",
                  desc: "Roles, approvals, and audit trails on every sensitive workflow.",
                },
                {
                  title: "Rate limits",
                  desc: "Per-workspace and per-tenant throttles to prevent abuse.",
                },
                {
                  title: "Isolation by design",
                  desc: "Contacts, templates, and entitlements stay scoped to the right workspace.",
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
                  Compliance for regulated messaging
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
                  Integrations teams expect
                </h2>
                <p className="mt-2 max-w-lg text-sm text-[#f5f5dc]/65">
                  Connect messaging, AI, data, and deployment tools to the same platform. No implied partnerships—just integrations that work.
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
              Logos belong to their respective owners. Integrations do not imply affiliation or endorsement.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-gigaviz-bg">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">Roadmap</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  Roadmap you can track
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
              Timelines may change. BSP/Partner listing remains in planning.
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialsSection />

        <section className="border-b border-[#d4af37]/15 bg-gradient-to-b from-[#050a18] via-[#0a1229]/40 to-[#050a18]">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">{t("pricingLabel")}</p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent md:text-3xl">
                  {t("pricingTitle")}
                </h2>
              </div>
              <Link
                href="/pricing"
                className="text-sm font-semibold text-[#d4af37] hover:text-[#f9d976] transition-colors"
              >
                {t("pricingViewAll")}
              </Link>
            </div>

            {/* Trial Badge */}
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t("pricingTrialBadge")}
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* Free */}
              <div className="rounded-2xl p-5 glass-imperium transition-all duration-300 hover:border-[#d4af37]/40">
                <h3 className="text-base font-semibold text-[#f5f5dc]">{t("pricingFreeName")}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">{t("pricingFreePrice")}</span>
                </div>
                <p className="mt-2 text-sm text-[#f5f5dc]/65">{t("pricingFreeDesc")}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-[#f5f5dc]/55">
                  <li>• {t("pricingFreeF1")}</li>
                  <li>• {t("pricingFreeF2")}</li>
                  <li>• {t("pricingFreeF3")}</li>
                </ul>
                <Link
                  href="/get-started"
                  className="mt-4 inline-flex items-center rounded-xl border border-[#f5f5dc]/20 bg-[#0a1229]/60 px-4 py-2 text-sm font-semibold text-[#f5f5dc] transition hover:border-[#d4af37]/50"
                >
                  {t("pricingFreeCta")}
                </Link>
              </div>

              {/* Starter */}
              <div className="rounded-2xl p-5 glass-imperium transition-all duration-300 hover:border-[#d4af37]/40">
                <h3 className="text-base font-semibold text-[#f5f5dc]">{t("pricingStarterName")}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">{t("pricingStarterPrice")}</span>
                  <span className="text-xs text-[#f5f5dc]/50">{t("pricingPerMonth")}</span>
                </div>
                <p className="mt-2 text-sm text-[#f5f5dc]/65">{t("pricingStarterDesc")}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-[#f5f5dc]/55">
                  <li>• {t("pricingStarterF1")}</li>
                  <li>• {t("pricingStarterF2")}</li>
                  <li>• {t("pricingStarterF3")}</li>
                </ul>
                <Link
                  href="/get-started?plan=starter&trial=1"
                  className="mt-4 inline-flex items-center rounded-xl border border-[#f5f5dc]/20 bg-[#0a1229]/60 px-4 py-2 text-sm font-semibold text-[#f5f5dc] transition hover:border-[#d4af37]/50"
                >
                  {t("pricingStarterCta")}
                </Link>
              </div>

              {/* Growth — Most Popular */}
              <div className="relative rounded-2xl p-5 glass-imperium ring-2 ring-[#d4af37]/50 shadow-[0_0_32px_-8px_#d4af37] transition-all duration-300">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-3 py-0.5 text-[10px] font-bold uppercase text-[#050a18]">
                  {t("pricingMostPopular")}
                </span>
                <h3 className="text-base font-semibold text-[#f5f5dc]">{t("pricingGrowthName")}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">{t("pricingGrowthPrice")}</span>
                  <span className="text-xs text-[#f5f5dc]/50">{t("pricingPerMonth")}</span>
                </div>
                <p className="mt-2 text-sm text-[#f5f5dc]/65">{t("pricingGrowthDesc")}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-[#f5f5dc]/55">
                  <li>• {t("pricingGrowthF1")}</li>
                  <li>• {t("pricingGrowthF2")}</li>
                  <li>• {t("pricingGrowthF3")}</li>
                </ul>
                <Link
                  href="/get-started?plan=growth&trial=1"
                  className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-4 py-2 text-sm font-semibold text-[#050a18] shadow-[0_4px_20px_-4px_#d4af37] transition hover:shadow-[0_8px_28px_-4px_#d4af37]"
                >
                  {t("pricingGrowthCta")}
                </Link>
              </div>

              {/* Business */}
              <div className="rounded-2xl p-5 glass-imperium transition-all duration-300 hover:border-[#d4af37]/40">
                <h3 className="text-base font-semibold text-[#f5f5dc]">{t("pricingBusinessName")}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">{t("pricingBusinessPrice")}</span>
                  <span className="text-xs text-[#f5f5dc]/50">{t("pricingPerMonth")}</span>
                </div>
                <p className="mt-2 text-sm text-[#f5f5dc]/65">{t("pricingBusinessDesc")}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-[#f5f5dc]/55">
                  <li>• {t("pricingBusinessF1")}</li>
                  <li>• {t("pricingBusinessF2")}</li>
                  <li>• {t("pricingBusinessF3")}</li>
                </ul>
                <Link
                  href="/get-started?plan=business&trial=1"
                  className="mt-4 inline-flex items-center rounded-xl border border-[#f5f5dc]/20 bg-[#0a1229]/60 px-4 py-2 text-sm font-semibold text-[#f5f5dc] transition hover:border-[#d4af37]/50"
                >
                  {t("pricingBusinessCta")}
                </Link>
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl p-5 glass-imperium transition-all duration-300 hover:border-[#e11d48]/40 border-[#e11d48]/20">
                <h3 className="text-base font-semibold text-[#f5f5dc]">{t("pricingEnterpriseName")}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-semibold bg-gradient-to-r from-[#e11d48] to-[#f9d976] bg-clip-text text-transparent">{t("pricingEnterprisePrice")}</span>
                </div>
                <p className="mt-2 text-sm text-[#f5f5dc]/65">{t("pricingEnterpriseDesc")}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-[#f5f5dc]/55">
                  <li>• {t("pricingEnterpriseF1")}</li>
                  <li>• {t("pricingEnterpriseF2")}</li>
                  <li>• {t("pricingEnterpriseF3")}</li>
                </ul>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center rounded-xl border border-[#e11d48]/30 bg-[#0a1229]/60 px-4 py-2 text-sm font-semibold text-[#f5f5dc] transition hover:border-[#e11d48]/60"
                >
                  {t("pricingEnterpriseCta")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Updates Section */}
        <section className="mb-32">
          <LatestUpdates />
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
                <h2 className="text-2xl font-gvDisplay font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">{t("ctaSectionTitle")}</h2>
                <p className="max-w-md text-sm text-[#f5f5dc]/65">
                  Start free and connect your WhatsApp Business account in minutes. Manage customers, automate with AI, and scale your operations — all in one place.
                </p>
              </div>
              <div className="relative mt-6 flex flex-wrap gap-3 md:mt-0">
                <TrackedLink
                  href="/get-started"
                  label={t("ctaOnboarding")}
                  location="homepage_footer"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-6 py-3 text-sm font-semibold text-[#050a18] shadow-[0_8px_32px_-8px_#d4af37] transition hover:shadow-[0_12px_40px_-8px_#d4af37]"
                >
                  {t("ctaOnboarding")}
                </TrackedLink>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-[#f5f5dc]/20 bg-[#0a1229]/60 px-6 py-3 text-sm font-semibold text-[#f5f5dc] backdrop-blur transition hover:border-[#d4af37]/50"
                >
                  {tc("learnMore")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="border-t border-[#d4af37]/15 bg-[#050a18]">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-xl text-center">
              <h3 className="text-lg font-gvDisplay font-semibold text-[#f5f5dc]">Stay in the loop</h3>
              <p className="mt-2 text-sm text-[#f5f5dc]/60">Get product updates, tips, and early access to new features.</p>
              <div className="mt-6">
                <NewsletterCapture source="homepage" />
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
