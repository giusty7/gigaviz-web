import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Arena",
  description:
    "Play, create, dan commission mini-game untuk engagement brand dengan template aman dan workflow terarah.",
  alternates: {
    canonical: "/products/arena",
  },
  openGraph: {
    title: "Gigaviz Arena",
    description:
      "Play, create, dan commission mini-game untuk engagement brand dengan template aman dan workflow terarah.",
    url: "/products/arena",
  },
};

const playItems = [
  "Game kurasi orisinal dari Gigaviz",
  "Format ringan untuk campaign singkat",
  "Disiapkan untuk update konten berkala",
];

const createItems = [
  "Mini-game builder berbasis template (planned)",
  "Variasi theme dan branding sederhana",
  "Kontrol durasi dan flow permainan",
];

const commissionItems = [
  "Request game custom sesuai campaign",
  "Terhubung ke Apps untuk ticketing dan roadmap",
  "Review scope dan timeline per proyek",
];

const gamificationItems = [
  "Challenges musiman untuk engagement",
  "Badges dan progress ringan",
  "Leaderboard sederhana (opsional)",
];

const safetyPoints = [
  {
    title: "Sandbox berbasis template",
    desc: "Pembuatan game dibatasi pada template agar tetap aman dan terkontrol.",
  },
  {
    title: "Tanpa eksekusi kode bebas",
    desc: "Arena tidak mengizinkan arbitrary code execution untuk menjaga keamanan.",
  },
  {
    title: "Moderasi konten",
    desc: "Konten game dievaluasi agar sesuai dengan kebijakan brand.",
  },
];

const faqs = [
  {
    question: "Apa itu Gigaviz Arena?",
    answer:
      "Arena adalah modul untuk play, create, dan commission mini-game guna meningkatkan engagement.",
  },
  {
    question: "Apakah saya bisa membuat game sendiri?",
    answer:
      "Builder berbasis template disiapkan bertahap. Saat ini fokus pada kurasi dan request.",
  },
  {
    question: "Bagaimana cara memesan game custom?",
    answer:
      "Request dilakukan melalui Apps dengan brief, scope, dan timeline yang disepakati.",
  },
  {
    question: "Apakah ada fitur gamification?",
    answer:
      "Gamification seperti badges dan leaderboard tersedia secara opsional.",
  },
  {
    question: "Apakah aman untuk kampanye brand?",
    answer:
      "Arena dirancang dengan template dan kontrol konten untuk menjaga brand safety.",
  },
  {
    question: "Bagaimana pricing Arena?",
    answer:
      "Pricing mengikuti paket langganan dan kebutuhan produksi game custom.",
  },
  {
    question: "Apa batasan utama Arena?",
    answer:
      "Fokus pada game ringan dan template. Fitur lanjutan hadir bertahap.",
  },
];

const relatedLinks = [
  {
    title: "Gigaviz Platform (Core OS)",
    desc: "Fondasi akun, workspace, dan billing untuk semua modul.",
    href: "/products/platform",
    cta: "Lihat Core OS",
  },
  {
    title: "Gigaviz Studio",
    desc: "Studio kreatif untuk asset visual dan audio.",
    href: "/products/studio",
    cta: "Lihat Studio",
  },
  {
    title: "Gigaviz Apps",
    desc: "Ticketing dan request untuk kebutuhan custom.",
    href: "/products/apps",
    cta: "Lihat Apps",
  },
];

export default function ArenaPage() {
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
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)]">
                  <MarketingIcon
                    name="arena"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Arena
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Play - Create - Commission untuk mini-game campaign yang ringan dan aman.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/products/arena#play"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Mainkan Demo
                </Link>
                <Link
                  href="/products/arena#create"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Buat Mini-Game
                </Link>
                <Link
                  href="/products/arena#commission"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Pesan Game
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Arena Play
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Arena Create
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Arena Commission
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Ringkasan Arena
              </h2>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                Arena menggabungkan katalog game, builder template, dan request game custom dalam satu alur.
              </p>
              <div className="mt-4 grid gap-3 text-sm text-[color:var(--gv-muted)]">
                <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4">
                  Play - koleksi game kurasi untuk engagement cepat.
                </div>
                <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4">
                  Create - builder template untuk mini-game yang ringan.
                </div>
                <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4">
                  Commission - request game custom via Apps.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="play" className="scroll-mt-24 border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Arena Play
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Game kurasi untuk campaign yang cepat
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Koleksi game ringan yang siap dipakai untuk aktivasi brand.
                </p>
              </div>
              <ul className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {playItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="create" className="scroll-mt-24 border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Arena Create
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Builder mini-game berbasis template
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Template builder disiapkan agar tim bisa membuat game tanpa kompleksitas teknis.
                </p>
              </div>
              <ul className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {createItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="commission" className="scroll-mt-24 border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Arena Commission
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Request game custom untuk brand
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Tim dapat memesan game khusus dengan brief dan scope yang jelas.
                </p>
              </div>
              <ul className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {commissionItems.map((item) => (
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
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Gamification
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Engagement yang lebih seru (opsional)
                </h2>
              </div>
              <ul className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {gamificationItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Keamanan
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Arena aman dengan kontrol yang jelas
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Builder dan konten dikurasi agar cocok untuk kampanye brand.
                </p>
              </div>
              <div className="space-y-3">
                {safetyPoints.map((item) => (
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
              </div>
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
                Pertanyaan tentang Gigaviz Arena
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
                  Modul terkait
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Ekosistem pendukung Arena
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
                  Siap mencoba Arena?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai dengan game kurasi atau ajukan request game custom.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Mulai
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Hubungi Sales
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
