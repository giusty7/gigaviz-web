import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Marketplace",
  description:
    "Marketplace untuk menjual dan membeli template, prompt pack, asset kreatif, dan mini-app dalam ekosistem Gigaviz.",
  alternates: {
    canonical: "/products/marketplace",
  },
  openGraph: {
    title: "Gigaviz Marketplace",
    description:
      "Marketplace untuk menjual dan membeli template, prompt pack, asset kreatif, dan mini-app dalam ekosistem Gigaviz.",
    url: "/products/marketplace",
  },
};

const sellItems = [
  "Template Office (spreadsheet, dokumen, dashboard)",
  "Prompt pack untuk Studio dan Helper",
  "Asset kreatif siap pakai (visual/audio)",
  "Mini-app dan automasi dari Gigaviz Apps",
];

const featureCards = [
  {
    title: "Listing terstruktur",
    desc: "Katalog produk digital yang mudah ditemukan dan diatur.",
  },
  {
    title: "Lisensi personal vs komersial",
    desc: "Pengaturan lisensi untuk membedakan penggunaan individu atau bisnis.",
  },
  {
    title: "Discovery",
    desc: "Pencarian, kategori, dan highlight produk terbaik.",
  },
  {
    title: "Bundles",
    desc: "Jual paket template atau asset dalam satu bundel.",
  },
  {
    title: "Reviews",
    desc: "Ulasan dan rating untuk menjaga kualitas listing.",
  },
  {
    title: "Payout & komisi (planned)",
    desc: "Pembayaran creator dan komisi marketplace disiapkan bertahap.",
  },
];

const safetyPoints = [
  {
    title: "Kurasi konten",
    desc: "Listing mengikuti panduan kualitas dan hak cipta yang berlaku.",
  },
  {
    title: "Moderasi bertahap",
    desc: "Produk yang melanggar aturan akan ditinjau dan dapat diturunkan.",
  },
  {
    title: "Perlindungan lisensi",
    desc: "Produk diatur dengan lisensi jelas agar penggunaan tetap aman.",
  },
];

const faqs = [
  {
    question: "Apa yang bisa dijual di Marketplace?",
    answer:
      "Template Office, prompt pack, asset kreatif, dan mini-app yang relevan dengan ekosistem Gigaviz.",
  },
  {
    question: "Apakah saya bisa menjual bundle?",
    answer:
      "Bisa, bundel disiapkan untuk menjual beberapa aset sekaligus.",
  },
  {
    question: "Bagaimana lisensi personal vs komersial bekerja?",
    answer:
      "Lisensi personal untuk penggunaan individu, komersial untuk bisnis dan klien.",
  },
  {
    question: "Apakah ada proses kurasi?",
    answer:
      "Ya, setiap listing mengikuti panduan kualitas dan kepatuhan hak cipta.",
  },
  {
    question: "Kapan payout tersedia?",
    answer:
      "Payout dan komisi akan hadir bertahap sesuai roadmap Marketplace.",
  },
  {
    question: "Bagaimana pricing produk digital?",
    answer:
      "Harga ditentukan oleh creator dengan panduan standar dan review berkala.",
  },
  {
    question: "Apakah ada batasan konten?",
    answer:
      "Konten melanggar hak cipta atau kebijakan akan ditolak atau dihapus.",
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
    desc: "Request, ticketing, dan mini roadmap per klien.",
    href: "/products/apps",
    cta: "Lihat Apps",
  },
];

export default function MarketplacePage() {
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
                    name="marketplace"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Marketplace
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Marketplace untuk menjual dan membeli template, prompt pack, asset kreatif, dan mini-app.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Buka Marketplace
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Pricing
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Template & prompt pack
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Asset kreatif
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Mini-app
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Apa yang bisa dijual
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                {sellItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-xs text-[color:var(--gv-muted)]">
                Marketplace disiapkan untuk creator yang ingin monetisasi karya digital.
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Fitur utama
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Marketplace yang siap tumbuh bersama creator
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Fitur disiapkan untuk menjaga listing rapi, lisensi jelas, dan transaksi aman.
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
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Keamanan & moderasi
              </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Moderasi untuk menjaga kualitas
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Marketplace dirancang untuk mendukung kepatuhan lisensi dan kualitas produk digital.
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                FAQ
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Pertanyaan tentang Gigaviz Marketplace
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
                  Modul terkait
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Ekosistem pendukung Marketplace
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
                  Siap masuk ke Marketplace?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Bangun listing pertama dan perluas jangkauan produk digital Anda.
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
