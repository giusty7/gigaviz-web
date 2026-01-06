import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Office",
  description:
    "Suite produktivitas untuk template kerja, asisten rumus, automasi workflow, dan generator dokumen/dasbor.",
  alternates: {
    canonical: "/products/office",
  },
  openGraph: {
    title: "Gigaviz Office",
    description:
      "Suite produktivitas untuk template kerja, asisten rumus, automasi workflow, dan generator dokumen/dasbor.",
    url: "/products/office",
  },
};

const summaryPoints = [
  "Template siap pakai untuk Excel, Google Sheets, dan Docs.",
  "Formula Assistant membantu menyusun rumus dengan cepat dan konsisten.",
  "Workflow automation untuk import/export data lintas modul.",
  "Generator dokumen dan dashboard untuk laporan instan.",
];

const problemPoints = [
  "Mempercepat pelaporan bulanan tanpa mengulang format.",
  "Mengurangi error formula dan konsistensi data tim.",
  "Standarisasi output agar semua unit memakai format yang sama.",
  "Automasi input/output agar data tidak perlu diinput ulang.",
  "Memastikan laporan siap audit dengan jejak perubahan yang jelas.",
];

const featureCards = [
  {
    title: "Template Library",
    desc: "Kumpulan template Excel, Sheets, dan Docs untuk laporan, invoice, dan operasional.",
  },
  {
    title: "Formula Assistant",
    desc: "Susun rumus dengan panduan AI agar formula lebih cepat dan minim error.",
  },
  {
    title: "Import/Export Automation",
    desc: "Sinkronisasi data CSV/XLSX. Konektor Google Sheets berada di roadmap.",
  },
  {
    title: "Document Generator",
    desc: "Buat laporan, invoice, atau surat dengan sekali klik dari data terstruktur.",
  },
  {
    title: "Dashboard Builder",
    desc: "Bangun dashboard KPI sederhana untuk monitoring performa.",
  },
  {
    title: "Data Validation & Formatting",
    desc: "Bantu menjaga format angka, tanggal, dan kategori agar konsisten.",
  },
];

const workflowExamples = [
  {
    title: "Monthly report dalam 10 menit",
    steps: [
      "Import data dari spreadsheet atau CSV",
      "Validasi dan rapikan format",
      "Generate dokumen laporan otomatis",
      "Export ke PDF atau kirim ke stakeholder",
    ],
  },
  {
    title: "Commission tracker",
    steps: [
      "Pilih template komisi",
      "Masukkan data penjualan",
      "Gunakan Formula Assistant untuk hitung komisi",
      "Buat dashboard KPI komisi per tim",
    ],
  },
  {
    title: "Ops checklist + summary",
    steps: [
      "Isi checklist operasional dari template",
      "Rangkum status dan temuan utama",
      "Generate dokumen ringkas untuk review",
      "Bagikan ke tim terkait",
    ],
  },
];

const safetyPoints = [
  {
    title: "Review manusia untuk output kritikal",
    desc: "Pastikan laporan final diperiksa sebelum digunakan untuk keputusan penting.",
  },
  {
    title: "Versioning template",
    desc: "Template dapat ditinjau ulang agar perubahan format tidak hilang jejak.",
  },
  {
    title: "Auditability via Core OS",
    desc: "Jika terhubung ke Core OS, aktivitas dapat dicatat untuk audit.",
  },
  {
    title: "Akurasi tetap terbatas",
    desc: "Otomasi membantu, tetapi hasil akhir tetap perlu verifikasi.",
  },
];

const faqs = [
  {
    question: "Format apa saja yang didukung?",
    answer:
      "Office mendukung template Excel, Google Sheets, dan Docs. Import CSV/XLSX tersedia.",
  },
  {
    question: "Apakah bisa dipakai di Google Sheets dan Excel?",
    answer:
      "Bisa, dengan template yang disesuaikan. Konektor langsung Google Sheets berada di roadmap.",
  },
  {
    question: "Bagaimana cara kerja automasi import/export?",
    answer:
      "Data dapat diunggah dari file atau diekspor kembali ke format standar sesuai template.",
  },
  {
    question: "Apakah template bisa dikustom?",
    answer:
      "Bisa, template dapat diedit agar sesuai struktur data tim.",
  },
  {
    question: "Bagaimana skema pricing?",
    answer:
      "Office mengikuti paket langganan dan kebutuhan modul, detail ada di halaman pricing.",
  },
  {
    question: "Apa batasannya?",
    answer:
      "Office membantu struktur dan automasi, namun hasil akhir tetap perlu review manusia.",
  },
  {
    question: "Apakah ada dashboard siap pakai?",
    answer:
      "Dashboard builder menyediakan KPI dasar dan dapat dikembangkan sesuai kebutuhan.",
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
    title: "Gigaviz Helper",
    desc: "Asisten AI untuk drafting, rangkuman, dan riset ringan.",
    href: "/products/helper",
    cta: "Lihat Helper",
  },
  {
    title: "Gigaviz Studio",
    desc: "Studio kreatif untuk asset visual, video, dan audio.",
    href: "/products/studio",
    cta: "Lihat Studio",
  },
];

export default function OfficePage() {
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
                    name="office"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Office
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Template kerja, asisten rumus, automasi workflow, dan generator dokumen/dasbor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Coba Office
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
                  Template kerja
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Formula Assistant
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Automasi workflow
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
                Office menyederhanakan pekerjaan tim finance, ops, dan admin.
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Yang diselesaikan
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Mengurangi beban kerja manual dan kesalahan data
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                {problemPoints.map((item) => (
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
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Fitur utama
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Semua alat produktivitas dalam satu workflow
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Dari template hingga automasi, Office dirancang agar laporan jadi lebih cepat.
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
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Contoh workflow
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Alur kerja nyata yang bisa langsung dipakai
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowExamples.map((workflow) => (
                <div
                  key={workflow.title}
                  className="flex h-full flex-col rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                    {workflow.title}
                  </h3>
                  <ol className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                    {workflow.steps.map((step, index) => (
                      <li key={step} className="flex gap-2">
                        <span className="mt-0.5 text-xs font-semibold text-[color:var(--gv-accent)]">
                          {index + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Keamanan & reliabilitas
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Hasil yang bisa diaudit dan tetap aman
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Office membantu mempercepat, namun review manusia tetap disarankan.
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
                Pertanyaan tentang Gigaviz Office
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
                  Lengkapi workflow Office dengan modul lain
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
                  Siap merapikan workflow tim?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai dari template sederhana, lalu otomatisasi sesuai kebutuhan.
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
