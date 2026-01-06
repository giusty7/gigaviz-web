import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Pay",
  description:
    "Wallet, invoice, payment link, dan subscription billing untuk transaksi yang lebih rapi dan terkontrol.",
  alternates: {
    canonical: "/products/pay",
  },
  openGraph: {
    title: "Gigaviz Pay",
    description:
      "Wallet, invoice, payment link, dan subscription billing untuk transaksi yang lebih rapi dan terkontrol.",
    url: "/products/pay",
  },
};

const summaryPoints = [
  "Wallet internal untuk pemantauan saldo dan aliran dana.",
  "Invoice generator untuk penagihan yang konsisten.",
  "Payment link untuk pembayaran cepat tanpa integrasi rumit.",
  "Subscription billing untuk paket dan add-on modular.",
];

const featureCards = [
  {
    title: "Wallet & balance overview",
    desc: "Gambaran saldo dan aliran dana secara terpusat (concept).",
  },
  {
    title: "Invoice generator",
    desc: "Buat invoice rapi dengan status pembayaran yang jelas.",
  },
  {
    title: "Payment links",
    desc: "Bagikan link pembayaran langsung ke pelanggan.",
  },
  {
    title: "Subscription billing",
    desc: "Kelola paket langganan dan add-on secara fleksibel.",
  },
  {
    title: "Transaction history & exports",
    desc: "Riwayat transaksi lengkap dan ekspor laporan.",
  },
  {
    title: "Refunds & adjustments (planned)",
    desc: "Rencana penyesuaian dan refund sesuai kebijakan bisnis.",
  },
  {
    title: "Marketplace payouts (planned)",
    desc: "Payout dan komisi untuk creator Marketplace (bertahap).",
  },
];

const steps = [
  "Buat invoice atau payment link.",
  "Pelanggan melakukan pembayaran.",
  "Status transaksi otomatis diperbarui.",
  "Transaksi tercatat di riwayat.",
  "Export data untuk laporan dan rekonsiliasi.",
];

const safetyPoints = [
  {
    title: "Keamanan data",
    desc: "Data transaksi disimpan dengan kontrol keamanan berlapis.",
  },
  {
    title: "Auditability via Core OS",
    desc: "Aktivitas pembayaran dapat dicatat untuk audit bila terhubung ke Core OS.",
  },
  {
    title: "Access control",
    desc: "Akses mengikuti role dan workspace agar tidak semua orang dapat mengubah billing.",
  },
  {
    title: "Fraud prevention (high-level)",
    desc: "Dirancang untuk mendukung deteksi anomali dan kontrol risiko.",
  },
];

const faqs = [
  {
    question: "Metode pembayaran apa yang didukung?",
    answer:
      "Metode pembayaran mengikuti integrasi yang tersedia di wilayah Anda dan akan diperluas bertahap.",
  },
  {
    question: "Apakah ada biaya tambahan?",
    answer:
      "Biaya transaksi tergantung metode dan paket langganan. Detail tersedia pada pricing.",
  },
  {
    question: "Bagaimana subscription billing bekerja?",
    answer:
      "Paket dan add-on dapat diatur per periode dengan status yang transparan.",
  },
  {
    question: "Apakah invoice bisa dikustom?",
    answer:
      "Invoice disesuaikan dengan detail bisnis dan informasi pembayaran yang diperlukan.",
  },
  {
    question: "Bagaimana proses refund?",
    answer:
      "Refund direncanakan sebagai fitur bertahap sesuai kebijakan bisnis.",
  },
  {
    question: "Apakah ada batasan penggunaan?",
    answer:
      "Batasan mengikuti paket langganan dan kebijakan risiko.",
  },
  {
    question: "Apakah data transaksi bisa diekspor?",
    answer:
      "Ya, riwayat transaksi dapat diekspor untuk laporan dan rekonsiliasi.",
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
    title: "Gigaviz Marketplace",
    desc: "Marketplace untuk listing produk digital dan payout bertahap.",
    href: "/products/marketplace",
    cta: "Lihat Marketplace",
  },
  {
    title: "Gigaviz Apps",
    desc: "Request aplikasi custom dan ticketing yang terstruktur.",
    href: "/products/apps",
    cta: "Lihat Apps",
  },
  {
    title: "Gigaviz Meta Hub",
    desc: "Hub WhatsApp Cloud API untuk template dan campaign.",
    href: "/products/meta-hub",
    cta: "Lihat Meta Hub",
  },
];

export default function PayPage() {
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
                    name="pay"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Pay
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Wallet, invoice, payment link, dan subscription billing untuk transaksi yang rapi.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Aktifkan Pay
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
                  Wallet
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Invoice
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Subscription
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
                Pay membantu tim finance mengelola transaksi secara terstruktur.
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
                Fondasi billing yang siap tumbuh
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Pay menggabungkan invoice, payment link, dan subscription dalam satu workflow.
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
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Cara kerja
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Alur transaksi yang jelas
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5"
                >
                  <div className="text-xs font-semibold text-[color:var(--gv-accent)]">
                    {index + 1}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Keamanan & compliance
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Transaksi aman dengan kontrol akses
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Pay dirancang untuk menjaga data pembayaran tetap aman dan teraudit.
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

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                FAQ
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Pertanyaan tentang Gigaviz Pay
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
                  Ekosistem pendukung Pay
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  Siap mengaktifkan Pay?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai dari invoice sederhana hingga subscription billing yang rapi.
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
