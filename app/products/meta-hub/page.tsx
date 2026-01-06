import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Meta Hub",
  description:
    "Hub WhatsApp Cloud API untuk template, webhook, inbox, scheduler, dan analytics dengan fokus kepatuhan dan skalabilitas.",
  alternates: {
    canonical: "/products/meta-hub",
  },
  openGraph: {
    title: "Gigaviz Meta Hub",
    description:
      "Hub WhatsApp Cloud API untuk template, webhook, inbox, scheduler, dan analytics dengan fokus kepatuhan dan skalabilitas.",
    url: "/products/meta-hub",
  },
};

const summaryPoints = [
  "Integrasi WhatsApp Cloud API untuk WABA dan Phone Number ID (independent provider, BSP sebagai jalur upgrade).",
  "Template Manager dan Webhook Receiver untuk approval, pesan masuk, serta status callback.",
  "Inbox bersama dan Campaign Scheduler untuk broadcast terjadwal dengan opt-in/opt-out.",
  "Analytics delivery/read/fail dan ringkasan performa kampanye.",
];

const featureCards = [
  {
    title: "WhatsApp Cloud API Integration",
    desc: "Hubungkan WABA/Phone Number ID langsung ke Gigaviz. Saat ini independent provider, BSP tersedia sebagai upgrade roadmap.",
  },
  {
    title: "Template Manager",
    desc: "Kelola template yang disetujui, kategori, bahasa, dan variable dinamis untuk pesan yang konsisten.",
  },
  {
    title: "Webhook Receiver",
    desc: "Terima pesan masuk dan status callback untuk sinkronisasi ke sistem internal.",
  },
  {
    title: "Shared Inbox",
    desc: "Inbox terpusat untuk balasan tim. Assignment dan notes berada di roadmap.",
  },
  {
    title: "Campaign Scheduler",
    desc: "Broadcast terjadwal dengan kontrol waktu. Segmentasi lanjutan direncanakan.",
  },
  {
    title: "Opt-in / Opt-out",
    desc: "Kelola persetujuan pengguna dan hormati permintaan berhenti berlangganan.",
  },
  {
    title: "Analytics",
    desc: "Laporan delivery/read/fail serta ringkasan performa per kampanye.",
  },
];

const compliancePoints = [
  {
    title: "Persetujuan wajib",
    desc: "Pengiriman pesan dirancang untuk mendukung persetujuan yang valid, dan opt-out harus dihormati.",
  },
  {
    title: "Aturan template WhatsApp",
    desc: "Template mengikuti aturan Meta dan melalui proses approval resmi sebelum digunakan.",
  },
  {
    title: "Rate limiting / throttling",
    desc: "Dirancang untuk mendukung pembatasan laju agar menghindari ban dan lonjakan biaya.",
  },
  {
    title: "Anti-abuse & privasi data",
    desc: "Prinsip perlindungan data dan pencegahan penyalahgunaan diterapkan secara bertahap sesuai kebutuhan tim.",
  },
];

const howItWorks = [
  {
    title: "Connect WABA/Phone Number ID",
    desc: "Hubungkan akun Meta dan nomor yang disetujui untuk pengiriman pesan.",
  },
  {
    title: "Configure Webhook",
    desc: "Pasang endpoint webhook untuk pesan masuk dan status pengiriman.",
  },
  {
    title: "Create/Manage Templates",
    desc: "Siapkan template, kategori, dan bahasa lalu ajukan approval.",
  },
  {
    title: "Launch Campaign / Manage Inbox",
    desc: "Jadwalkan broadcast dan kelola percakapan tim dari inbox bersama.",
  },
  {
    title: "Review Analytics & Logs",
    desc: "Pantau delivery, read, fail, serta log aktivitas untuk evaluasi.",
  },
];

const faqs = [
  {
    question: "Apa itu WhatsApp Cloud API?",
    answer:
      "WhatsApp Cloud API adalah API resmi dari Meta untuk mengirim dan menerima pesan WhatsApp secara terprogram dari server Anda.",
  },
  {
    question: "Apakah saya perlu bisnis terverifikasi?",
    answer:
      "Tidak selalu untuk memulai. Namun verifikasi bisnis sering diperlukan untuk template dan volume pengiriman yang lebih tinggi.",
  },
  {
    question: "Apa arti status Beta?",
    answer:
      "Fitur inti tersedia, tetapi beberapa kemampuan masih berkembang. Perubahan dan penyesuaian dapat terjadi.",
  },
  {
    question: "Bagaimana opt-in dan opt-out bekerja?",
    answer:
      "Pengiriman dilakukan setelah ada persetujuan pengguna. Permintaan opt-out harus dihormati dan disimpan sebagai preferensi.",
  },
  {
    question: "Apa yang mempengaruhi biaya pesan?",
    answer:
      "Biaya ditentukan oleh Meta berdasarkan kategori template, negara tujuan, dan jenis percakapan.",
  },
  {
    question: "Apa perbedaan provider mandiri vs BSP?",
    answer:
      "Provider mandiri memakai Cloud API langsung dari Meta. BSP adalah jalur upgrade untuk dukungan enterprise dan layanan tambahan.",
  },
  {
    question: "Apakah ada pembatasan laju?",
    answer:
      "Platform dirancang untuk mendukung throttling dan kontrol jadwal agar menjaga kualitas pengiriman dan biaya.",
  },
  {
    question: "Bagaimana dengan keamanan data?",
    answer:
      "Dirancang untuk memisahkan data per workspace dan mencatat aktivitas penting agar dapat diaudit.",
  },
];

const relatedLinks = [
  {
    title: "Gigaviz Platform (Core OS)",
    desc: "Fondasi akun, workspace, billing, dan RBAC untuk semua modul.",
    href: "/products/platform",
    cta: "Lihat Core OS",
  },
  {
    title: "Kebijakan & Compliance",
    desc: "Pelajari aturan penggunaan dan kebijakan privasi Gigaviz.",
    href: "/policies",
    cta: "Lihat Kebijakan",
  },
  {
    title: "Pricing",
    desc: "Paket langganan untuk modul messaging dan kebutuhan tim.",
    href: "/pricing",
    cta: "Lihat Pricing",
  },
];

export default function MetaHubPage() {
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
                    name="meta"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Meta Hub
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Hub WhatsApp Cloud API untuk template, webhook, inbox, scheduler, dan analytics.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Mulai Integrasi
                </Link>
                <Link
                  href="/policies"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] bg-transparent px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Kebijakan
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
                  WhatsApp Cloud API
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Template Manager
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Inbox Terpusat
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
                Meta Hub berjalan di atas Core OS untuk autentikasi, workspace, dan billing.
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
                Semua komponen penting untuk messaging tim modern
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Meta Hub menggabungkan integrasi, pengelolaan template, inbox, scheduler, dan analytics dalam satu tempat.
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
                  Kepatuhan & keamanan
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Kepatuhan dan keamanan sebagai prioritas
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Dirancang untuk mendukung kepatuhan terhadap aturan WhatsApp dan menjaga reputasi pengiriman.
                </p>
              </div>
              <div className="space-y-3">
                {compliancePoints.map((item) => (
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
                  Cara kerja
                </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Alur sederhana dari integrasi hingga analytics
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {howItWorks.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] text-sm font-semibold text-[color:var(--gv-accent)]">
                      {index + 1}
                    </div>
                    <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
                    {step.desc}
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
                Pertanyaan yang sering diajukan
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
                  Fondasi dan kebijakan pendukung Meta Hub
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
                  Siap menjalankan Meta Hub?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai integrasi WhatsApp Cloud API dan kelola campaign dengan tim Anda.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Mulai Integrasi
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
