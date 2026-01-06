import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

export const metadata: Metadata = {
  title: "Gigaviz Community",
  description:
    "Ruang komunitas untuk diskusi, feedback, showcase karya, dan event agar ekosistem Gigaviz tumbuh bersama.",
  alternates: {
    canonical: "/products/community",
  },
  openGraph: {
    title: "Gigaviz Community",
    description:
      "Ruang komunitas untuk diskusi, feedback, showcase karya, dan event agar ekosistem Gigaviz tumbuh bersama.",
    url: "/products/community",
  },
};

const summaryPoints = [
  "Forum diskusi dan Q&A untuk berbagi insight.",
  "Feedback board untuk ide dan voting prioritas.",
  "Showcase karya dan studi kasus dari komunitas.",
  "Event dan webinar untuk belajar bersama (opsional).",
];

const featureCards = [
  {
    title: "Forum & Q&A",
    desc: "Ruang diskusi terbuka untuk tanya jawab dan berbagi pengalaman.",
  },
  {
    title: "Feedback board",
    desc: "Kumpulkan ide, voting, dan pantau perkembangan masukan.",
  },
  {
    title: "Showcase karya",
    desc: "Sorot karya terbaik agar komunitas saling terinspirasi.",
  },
  {
    title: "Challenges (opsional)",
    desc: "Tantangan kreatif yang bisa terhubung ke Arena.",
  },
  {
    title: "Events & webinars (opsional)",
    desc: "Sesi berbagi, pelatihan, dan update ekosistem.",
  },
  {
    title: "Moderation & safety",
    desc: "Aturan komunitas untuk menjaga diskusi tetap sehat.",
  },
];

const steps = [
  "Gabung ke Community.",
  "Posting atau ajukan pertanyaan.",
  "Dapatkan feedback dan diskusi.",
  "Showcase karya terbaik.",
  "Berkembang lewat event atau challenge.",
];

const safetyPoints = [
  {
    title: "Pelaporan konten",
    desc: "Pengguna dapat melaporkan konten yang melanggar aturan.",
  },
  {
    title: "Guidelines komunitas",
    desc: "Panduan perilaku untuk menjaga diskusi tetap relevan dan aman.",
  },
  {
    title: "Anti-spam",
    desc: "Kontrol dasar untuk membatasi spam dan promosi berlebihan.",
  },
  {
    title: "Role-based moderation",
    desc: "Moderasi dilakukan berdasarkan role dan tanggung jawab.",
  },
];

const faqs = [
  {
    question: "Siapa yang bisa bergabung?",
    answer:
      "Semua pengguna Gigaviz dapat bergabung sesuai aturan komunitas.",
  },
  {
    question: "Apakah ada biaya untuk Community?",
    answer:
      "Community mengikuti paket ekosistem. Detail tersedia di roadmap atau pricing.",
  },
  {
    question: "Bagaimana sistem feedback bekerja?",
    answer:
      "Ide dapat diajukan dan divoting untuk membantu prioritas roadmap.",
  },
  {
    question: "Apakah karya saya bisa ditampilkan publik?",
    answer:
      "Showcase bersifat opsional. Anda dapat memilih karya yang ingin dipublikasikan.",
  },
  {
    question: "Bagaimana moderation dilakukan?",
    answer:
      "Moderasi mengikuti guidelines dan dapat dilakukan oleh role khusus.",
  },
  {
    question: "Apakah challenge selalu tersedia?",
    answer:
      "Challenge diselenggarakan sesuai agenda komunitas dan kebutuhan campaign.",
  },
  {
    question: "Apakah event disediakan rutin?",
    answer:
      "Event dan webinar disiapkan secara berkala sesuai agenda ekosistem.",
  },
];

const relatedLinks = [
  {
    title: "Gigaviz Studio",
    desc: "Studio kreatif untuk asset visual dan audio.",
    href: "/products/studio",
    cta: "Lihat Studio",
  },
  {
    title: "Gigaviz Arena",
    desc: "Challenge dan engagement berbasis mini-game.",
    href: "/products/arena",
    cta: "Lihat Arena",
  },
  {
    title: "Gigaviz Marketplace",
    desc: "Jual beli template, prompt pack, dan asset kreatif.",
    href: "/products/marketplace",
    cta: "Lihat Marketplace",
  },
  {
    title: "Gigaviz Helper",
    desc: "Asisten AI untuk drafting dan rangkuman.",
    href: "/products/helper",
    cta: "Lihat Helper",
  },
];

export default function CommunityPage() {
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
                    name="community"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status="beta" />
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Community
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Ruang diskusi, feedback, dan showcase karya agar ekosistem tumbuh bersama.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Gabung Community
                </Link>
                <Link
                  href="/roadmap"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Roadmap
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Forum diskusi
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Feedback board
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Showcase karya
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
                Community membantu menyatukan pengguna, creator, dan tim Gigaviz.
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
                Community yang aktif dan terkurasi
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Diskusi, feedback, dan showcase berjalan dalam satu ruang yang aman.
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
                Alur sederhana untuk tumbuh bersama
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
                Keamanan & moderasi
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Komunitas yang aman dan tertib
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Moderasi dilakukan untuk menjaga diskusi tetap sehat.
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
                Pertanyaan tentang Gigaviz Community
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
                  Ekosistem pendukung Community
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
                  Siap gabung komunitas?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Temukan inspirasi dan tumbuh bersama creator lainnya.
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
