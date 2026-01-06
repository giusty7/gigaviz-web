import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Helper",
  description:
    "Asisten AI untuk chat, copy, rangkuman, dan riset ringan yang membantu tim bekerja lebih cepat dan konsisten.",
  alternates: {
    canonical: "/products/helper",
  },
  openGraph: {
    title: "Gigaviz Helper",
    description:
      "Asisten AI untuk chat, copy, rangkuman, dan riset ringan yang membantu tim bekerja lebih cepat dan konsisten.",
    url: "/products/helper",
  },
};

const summaryPoints = [
  "Chat AI untuk tanya jawab, brainstorming, dan riset ringan.",
  "Copy Generator untuk caption, skrip, dan draft konten.",
  "Summarizer dan auto-reply draft untuk mempercepat respon.",
  "Browsing opsional dengan kontrol akses sesuai kebutuhan.",
];

const featureCards = [
  {
    title: "Chat AI",
    desc: "Tanya jawab cepat untuk ide, data ringan, dan eksplorasi topik.",
  },
  {
    title: "Copy Generator",
    desc: "Buat draft copy untuk kampanye, konten sosial, dan komunikasi bisnis.",
  },
  {
    title: "Summarizer",
    desc: "Rangkum pesan masuk, dokumen, atau laporan agar cepat dipahami.",
  },
  {
    title: "Auto-reply Draft",
    desc: "Susun balasan awal untuk CS atau inbox agar konsisten dan hemat waktu.",
  },
  {
    title: "Browsing (Opsional)",
    desc: "Akses web ringan bila diaktifkan, dengan kontrol penggunaan dan sumber.",
  },
];

const useCases = [
  "Draft balasan cepat untuk customer support.",
  "Caption dan script kampanye dengan tone konsisten.",
  "Ringkasan SOP dan dokumentasi internal.",
  "Draft laporan mingguan atau update proyek.",
  "Brainstorming ide konten dan headline.",
  "Rangkuman percakapan panjang untuk eskalasi.",
  "Template jawaban FAQ internal.",
  "Draft pesan follow-up untuk sales.",
];

const safetyPoints = [
  {
    title: "Review manusia tetap penting",
    desc: "Output AI sebaiknya ditinjau sebelum dipublikasikan atau dikirim ke pelanggan.",
  },
  {
    title: "Hindari data sensitif",
    desc: "Jangan masukkan informasi rahasia atau data pribadi tanpa persetujuan.",
  },
  {
    title: "Akurasi bersifat terbatas",
    desc: "AI dapat salah atau bias; gunakan sebagai draft, bukan sumber final.",
  },
  {
    title: "Logging & privasi",
    desc: "Aktivitas dirancang untuk dicatat secara ringkas demi audit dan keamanan.",
  },
];

const faqs = [
  {
    question: "Data apa yang disimpan saat memakai Helper?",
    answer:
      "Secara umum, input dan output dapat dicatat untuk audit dan peningkatan kualitas, sesuai kebijakan privasi.",
  },
  {
    question: "Apakah Helper bisa browsing web?",
    answer:
      "Bisa jika fitur browsing diaktifkan. Akses dapat dibatasi sesuai kebijakan tim.",
  },
  {
    question: "Apakah Helper gratis?",
    answer:
      "Helper mengikuti paket langganan dan kuota token. Detail harga tersedia di halaman pricing.",
  },
  {
    question: "Bagaimana skema pricing Helper?",
    answer:
      "Biaya umumnya berbasis paket dan penggunaan token untuk AI generation.",
  },
  {
    question: "Apa batasan utama Helper?",
    answer:
      "Helper bersifat asisten. Output perlu review, dan tidak menggantikan keputusan manusia.",
  },
  {
    question: "Apakah Helper aman untuk data bisnis?",
    answer:
      "Gunakan hanya data yang sesuai kebijakan internal. Hindari data sensitif tanpa kontrol tambahan.",
  },
  {
    question: "Apakah output selalu akurat?",
    answer:
      "Tidak. AI bisa keliru, jadi verifikasi tetap diperlukan.",
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
    title: "Gigaviz Meta Hub",
    desc: "Hub WhatsApp Cloud API untuk template, webhook, dan inbox.",
    href: "/products/meta-hub",
    cta: "Lihat Meta Hub",
  },
  {
    title: "Gigaviz Office",
    desc: "Template kerja dan automasi dokumen untuk tim operasional.",
    href: "/products/office",
    cta: "Lihat Office",
  },
];

export default function HelperPage() {
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
                    name="helper"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Helper
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Asisten AI untuk chat, copy, rangkuman, dan riset ringan.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Coba Helper
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Pricing
                </Link>
                <Link
                  href="/policies"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Baca Kebijakan AI
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Chat AI
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Copy Generator
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Summarizer
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Ringkasan modul
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
                Helper tersedia untuk tim yang ingin mempercepat produksi konten dan respons.
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Apa yang dikerjakan
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Membantu tim menulis, merangkum, dan merespons lebih cepat
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Mempercepat produksi konten tanpa mengorbankan konsistensi.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Membantu tim merangkum informasi penting secara terstruktur.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Menyiapkan draft balasan agar komunikasi lebih cepat dan rapi.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Memudahkan brainstorming dan eksplorasi ide konten.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Fitur utama
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Asisten AI yang fleksibel untuk kebutuhan harian
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Pilih fitur yang sesuai dengan workflow tim, dari copy hingga rangkuman.
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
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Use cases
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Contoh penggunaan untuk tim kreatif dan operasional
                </h2>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {useCases.map((item) => (
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Safety & quality
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Keamanan dan kualitas tetap di tangan manusia
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Helper dirancang sebagai pendamping. Review manusia tetap disarankan untuk hasil akhir.
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
                Pertanyaan seputar Gigaviz Helper
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
                  Lengkapi workflow dengan modul lain
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
                  Siap mencoba Helper?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai dari kebutuhan kecil dan skalakan sesuai penggunaan tim.
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
