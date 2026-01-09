import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";
import { moduleStatusLabel, topLevelModules } from "@/lib/modules/catalog";
import TrackedLink from "@/components/analytics/tracked-link";

export const metadata: Metadata = {
  title: "Gigaviz Ecosystem Platform",
  description:
    "Satu akun, satu wallet, satu dashboard untuk Create, Automate, Monetize, dan Manage dalam satu ekosistem.",
};

const steps = [
  { title: "Create", desc: "Bangun konten, template, dan asset brand." },
  { title: "Automate", desc: "Otomasi workflow, pesan, dan approvals." },
  { title: "Monetize", desc: "Billing, invoice, payment link, subscription." },
  { title: "Manage", desc: "Audit, roles, dan monitoring pemakaian." },
];

const moduleKeysHomepage = ["platform", "meta_hub", "helper", "studio", "marketplace", "apps"];
const mainModules = topLevelModules
  .filter((m) => moduleKeysHomepage.includes(m.key))
  .slice(0, 6);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,178,94,0.18),_transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(226,75,168,0.14),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(255,255,255,0.04)_1px,_transparent_1px),linear-gradient(0deg,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[length:64px_64px]" />
          </div>

          <div className="container relative z-10 grid gap-12 py-20 md:grid-cols-[1.05fr_0.95fr] md:py-24">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Gigaviz Ecosystem Platform
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-4xl font-gvDisplay font-semibold md:text-5xl">
                  Create → Automate → Monetize → Manage
                </h1>
                <p className="text-pretty text-sm text-muted-foreground md:text-base">
                  Satu akun, satu wallet, satu dashboard untuk ekosistem digital Anda.
                  Semua modul berbagi auth, billing, audit, dan kontrol akses yang sama.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <TrackedLink
                  href="/get-started"
                  label="Mulai"
                  location="homepage_hero"
                  className="inline-flex items-center justify-center rounded-2xl bg-gigaviz-gold px-5 py-3 text-sm font-semibold text-gigaviz-navy shadow-[0_10px_40px_-15px_rgba(214,178,94,0.8)] hover:bg-gigaviz-gold/90"
                >
                  Get Started
                </TrackedLink>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-border bg-transparent px-5 py-3 text-sm font-semibold hover:border-gigaviz-gold hover:text-gigaviz-cream"
                >
                  Explore Products
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {["Single sign-on", "WhatsApp Cloud API", "AI + Automasi", "Billing & token usage"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-card px-3 py-1"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Ringkasan Ekosistem
                    </div>
                    <h2 className="mt-2 text-xl font-semibold">Modul utama terhubung</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Semua modul berjalan di ekosistem yang sama, dengan audit dan billing terpusat.
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground">
                    v1 Preview
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  {mainModules.map((module) => (
                    <div
                      key={module.slug}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-background">
                          <MarketingIcon name={module.icon} className="h-5 w-5 text-gigaviz-gold" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{module.name}</div>
                          <div className="text-xs text-muted-foreground">{module.short}</div>
                        </div>
                      </div>
                      <StatusBadge status={module.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Alur kerja
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold md:text-3xl">
                  Create → Automate → Monetize → Manage
                </h2>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-gigaviz-gold hover:underline"
              >
                Lihat semua modul
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-black/25"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-background text-sm font-semibold text-gigaviz-gold">
                      {index + 1}
                    </div>
                    <h3 className="text-base font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-gradient-to-b from-background via-card/40 to-background">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Modul utama
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold md:text-3xl">
                  Modul siap pakai untuk tim Anda
                </h2>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-gigaviz-gold hover:underline"
              >
                Lihat semua modul
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topLevelModules.map((module) => (
                <Link
                  key={module.slug}
                  href={module.hrefMarketing ?? `/products/${module.slug}`}
                  className="group flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-gigaviz-gold/70"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-background">
                      <MarketingIcon name={module.icon} className="h-6 w-6 text-gigaviz-gold" />
                    </div>
                    <StatusBadge status={module.status} />
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-lg font-semibold">{module.name}</h3>
                    <p className="text-sm text-muted-foreground">{module.short}</p>
                  </div>
                  <div className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-gigaviz-gold">
                    {moduleStatusLabel[module.status]}
                    <span className="ml-2 text-muted-foreground">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="container py-16 md:py-20">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Kenapa aman
              </p>
              <h2 className="mt-2 text-2xl font-gvDisplay font-semibold md:text-3xl">
                Dibangun dengan keamanan dan isolasi workspace
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "RLS & isolasi", desc: "Row-Level Security per workspace untuk semua data." },
                { title: "Audit logs", desc: "Event penting dicatat agar bisa ditinjau kembali." },
                { title: "Rate limiting", desc: "Perlindungan abuse di endpoint sensitif." },
                { title: "Workspace isolation", desc: "Token, billing, dan entitlements per workspace." },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-border bg-background p-5">
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="container py-16 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Pricing teaser
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold md:text-3xl">
                  Pilihan plan, token usage terpisah
                </h2>
              </div>
              <Link
                href="/pricing"
                className="text-sm font-semibold text-gigaviz-gold hover:underline"
              >
                Lihat detail paket
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  name: "Free Locked",
                  price: "Rp0",
                  desc: "Akses terbatas untuk evaluasi internal.",
                  badge: "Beta",
                },
                {
                  name: "Individual",
                  price: "Hubungi sales",
                  desc: "Creator / operator tunggal dengan token usage pay-as-you-go.",
                  badge: "Soon",
                },
                {
                  name: "Team",
                  price: "Hubungi sales",
                  desc: "Tim kolaborasi dengan entitlements, seats, dan batas token custom.",
                  badge: "Soon",
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-black/25"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                      {plan.badge}
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-gigaviz-gold">{plan.price}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                  <Link
                    href="/get-started"
                    className="mt-4 inline-flex items-center rounded-xl border border-border bg-gigaviz-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
                  >
                    Pilih paket
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container py-16 md:py-20">
            <div className="rounded-3xl border border-border bg-gradient-to-r from-gigaviz-gold/15 via-gigaviz-magenta/10 to-transparent p-8 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-gvDisplay font-semibold">Mulai sekarang</h2>
                <p className="text-sm text-muted-foreground">
                  Paket langganan untuk akses modul, token usage untuk AI/API actions.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
                <TrackedLink
                  href="/get-started"
                  label="Mulai"
                  location="homepage_footer"
                  className="inline-flex items-center justify-center rounded-2xl bg-gigaviz-gold px-5 py-3 text-sm font-semibold text-gigaviz-navy shadow-[0_10px_40px_-15px_rgba(214,178,94,0.8)] hover:bg-gigaviz-gold/90"
                >
                  Mulai langganan
                </TrackedLink>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-border px-5 py-3 text-sm font-semibold hover:border-gigaviz-gold"
                >
                  Hubungi sales
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
