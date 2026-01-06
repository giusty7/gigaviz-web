import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Studio",
  description:
    "Studio kreatif untuk gambar, video, dan musik dengan project workspace, asset library, versioning, dan prompt library.",
  alternates: {
    canonical: "/products/studio",
  },
  openGraph: {
    title: "Gigaviz Studio",
    description:
      "Studio kreatif untuk gambar, video, dan musik dengan project workspace, asset library, versioning, dan prompt library.",
    url: "/products/studio",
  },
};

const summaryPoints = [
  "Buat asset kreatif dengan cepat untuk kampanye dan konten brand.",
  "Simpan semua output di project workspace yang terorganisir.",
  "Gunakan ulang prompt agar hasil konsisten antar tim.",
  "Kelola versi dan revisi tanpa kehilangan riwayat.",
];

const featureCards = [
  {
    title: "Generative Image",
    desc: "Buat visual baru dengan prompt yang terkontrol dan preset style.",
  },
  {
    title: "Generative Video (planned)",
    desc: "Rencana pembuatan video pendek dengan kontrol durasi dan style.",
  },
  {
    title: "Generative Music (planned)",
    desc: "Rencana pembuatan musik dan audio branding berbasis prompt.",
  },
  {
    title: "Project Workspace",
    desc: "Kelola project per kampanye agar asset rapi dan mudah dicari.",
  },
  {
    title: "Asset Library",
    desc: "Tagging, search, dan collections untuk asset visual dan audio.",
  },
  {
    title: "Versioning",
    desc: "Riwayat versi dan konsep rollback untuk menjaga revisi.",
  },
  {
    title: "Prompt Library",
    desc: "Template prompt yang bisa dipakai ulang dan dibagikan di workspace.",
  },
];

const workflowSteps = [
  {
    title: "Create assets",
    desc: "Buat image, video, atau musik sesuai brief kreatif.",
  },
  {
    title: "Save to a project",
    desc: "Simpan asset ke project workspace agar tidak tercecer.",
  },
  {
    title: "Tag & organize",
    desc: "Kelompokkan asset dengan tag, collections, dan metadata.",
  },
  {
    title: "Reuse prompts & version",
    desc: "Gunakan prompt library dan simpan versi untuk iterasi cepat.",
  },
  {
    title: "Publish or export",
    desc: "Publikasikan ke Graph/Tracks atau export ke kanal lain.",
  },
];

const safetyPoints = [
  {
    title: "Hak kepemilikan konten",
    desc: "Konten yang dibuat ditujukan untuk penggunaan tim sesuai kebijakan internal.",
  },
  {
    title: "Hindari data sensitif",
    desc: "Jangan memasukkan data rahasia atau materi berisiko tanpa izin.",
  },
  {
    title: "Kontrol watermark & export (planned)",
    desc: "Rencana kontrol watermark dan format ekspor untuk menjaga brand safety.",
  },
  {
    title: "Fitur bertahap",
    desc: "Beberapa kemampuan disiapkan secara bertahap dan akan ditingkatkan.",
  },
];

const faqs = [
  {
    question: "Format file apa yang didukung?",
    answer:
      "Studio berfokus pada asset visual dan audio. Format ekspor akan disesuaikan per fitur.",
  },
  {
    question: "Bagaimana versioning bekerja?",
    answer:
      "Setiap perubahan dicatat sebagai versi sehingga tim bisa membandingkan dan kembali ke versi sebelumnya.",
  },
  {
    question: "Apakah prompt saya bersifat privat?",
    answer:
      "Prompt berada di workspace dan hanya dibagikan sesuai izin tim.",
  },
  {
    question: "Apakah konten boleh dipakai komersial?",
    answer:
      "Penggunaan komersial mengikuti kebijakan internal dan aturan model yang digunakan.",
  },
  {
    question: "Apakah ada batasan pricing?",
    answer:
      "Pricing mengikuti paket langganan dan penggunaan token/komputasi.",
  },
  {
    question: "Apakah fitur video dan musik sudah tersedia?",
    answer:
      "Masih dalam tahap roadmap. Saat ini fokus pada image dan workflow asset.",
  },
  {
    question: "Bagaimana integrasi dengan Graph/Tracks?",
    answer:
      "Studio dirancang untuk meneruskan asset ke Graph (galeri) dan Tracks (musik) saat siap.",
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
    title: "Gigaviz Graph",
    desc: "Galeri karya untuk publikasi visual dan studi kasus.",
    href: "/products/graph",
    cta: "Lihat Graph",
  },
  {
    title: "Gigaviz Tracks",
    desc: "Library musik dan lisensi untuk kebutuhan brand.",
    href: "/products/tracks",
    cta: "Lihat Tracks",
  },
  {
    title: "Gigaviz Office",
    desc: "Template kerja dan automasi dokumen untuk operasional.",
    href: "/products/office",
    cta: "Lihat Office",
  },
];

export default function StudioPage() {
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
                    name="studio"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Studio
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Studio kreatif untuk gambar, video, dan musik - dengan project workspace,
                  asset library, versioning, dan prompt library.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Coba Studio
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Pricing
                </Link>
                <Link
                  href="/products/graph"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Graph
                </Link>
                <Link
                  href="/products/tracks"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Tracks
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Generative Image
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Asset Library
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Prompt Library
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
                Studio menghubungkan workflow kreatif dengan Graph dan Tracks.
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Yang dimungkinkan
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Produksi kreatif yang cepat namun tetap teratur
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Menghasilkan asset visual dan audio lebih cepat.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Menjaga asset tetap rapi dengan project workspace.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Memakai ulang prompt untuk hasil yang konsisten.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Iterasi versi tanpa kehilangan histori.</span>
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
                Fitur kreatif yang menyatu dengan workflow tim
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Kombinasi generator, library, dan versioning untuk produksi kreatif yang stabil.
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
                Alur workflow
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Create - Organize - Reuse - Publish
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowSteps.map((step, index) => (
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
                Kualitas & keamanan
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Konten kreatif yang aman dan bertanggung jawab
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Studio dirancang untuk mendukung kepemilikan konten dan kontrol tim.
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
                Pertanyaan tentang Gigaviz Studio
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
                  Lengkapi Studio dengan modul lain
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
                  Siap mulai produksi kreatif?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai dari proyek kecil dan skalakan ke Graph dan Tracks.
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
