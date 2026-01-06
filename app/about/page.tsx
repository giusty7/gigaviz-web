import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Tentang Gigaviz",
  description:
    "Cerita Gigaviz membangun Ekosistem Digital Terpadu untuk Create, Automate, Monetize, dan Manage.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Tentang Gigaviz",
    description:
      "Cerita Gigaviz membangun Ekosistem Digital Terpadu untuk Create, Automate, Monetize, dan Manage.",
    url: "/about",
  },
};

const timeline = [
  {
    title: "Eksperimen awal",
    desc: "Berangkat dari kebutuhan praktis tim kecil yang butuh workflow cepat dan rapi.",
  },
  {
    title: "Modul pertama lahir",
    desc: "Mulai dari solusi messaging dan operasional, lalu berkembang menjadi rangkaian modul.",
  },
  {
    title: "Platform terintegrasi",
    desc: "Semua modul disatukan dengan identitas, workspace, dan billing yang konsisten.",
  },
  {
    title: "Legal entity",
    desc: "PT Gigaviz Digital Indonesia menjadi payung operasional untuk ekspansi ekosistem.",
  },
  {
    title: "Ecosystem v1.1",
    desc: "Fokus pada Create, Automate, Monetize, dan Manage dalam satu sistem terpadu.",
  },
];

const northStar = [
  {
    title: "Create",
    desc: "Membantu tim membuat konten, asset, dan materi kerja lebih cepat.",
  },
  {
    title: "Automate",
    desc: "Otomasi proses rutin agar tim fokus pada hal strategis.",
  },
  {
    title: "Monetize",
    desc: "Menyiapkan alat billing dan transaksi untuk mendukung revenue.",
  },
  {
    title: "Manage",
    desc: "Kontrol akses, audit, dan dashboard agar skala tetap aman.",
  },
];

const values = [
  "Clarity over complexity",
  "Security-first, sejak awal",
  "Practical by default",
  "Measurable outcomes",
  "Iterasi berbasis feedback",
];

export default function AboutPage() {
  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Tentang Gigaviz
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Tentang Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Ekosistem Digital Terpadu untuk Create -&gt; Automate -&gt; Monetize -&gt; Manage.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Mulai
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Produk
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Cerita kami
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Dari kebutuhan praktis ke ekosistem yang terpadu
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Gigaviz berawal dari masalah nyata: tim kecil harus bergerak cepat tanpa kehilangan kontrol.
                  Dari situ, kami merancang modul demi modul yang kemudian bertemu menjadi satu sistem terpadu.
                  Dioperasikan oleh PT Gigaviz Digital Indonesia, ekosistem ini dirancang untuk mempercepat
                  eksekusi sekaligus menjaga kejelasan dan keamanan.
                </p>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Dengan kompas Create -&gt; Automate -&gt; Monetize -&gt; Manage, setiap modul dibangun agar saling
                  menguatkan - mulai dari produksi konten hingga kontrol akses dan billing.
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                  <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                    Founder
                  </div>
                  <div className="mt-3 text-sm text-[color:var(--gv-text)]">
                    Giusty Adhyarachmat Eryan (Giusty)
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    Giusty membangun Gigaviz agar tim bisa fokus pada hasil tanpa terganggu alat yang terpisah.
                    Misinya adalah menghadirkan ekosistem yang praktis, aman, dan bisa diukur.
                  </p>
                </div>

                <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                  <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                    Masalah yang diselesaikan
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                    <li className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>Kecepatan eksekusi tanpa chaos operasional.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>Kejelasan keputusan lewat data dan audit.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>Kontrol akses agar tim tetap aman saat tumbuh.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>Monetisasi yang terukur melalui billing terintegrasi.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Timeline
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Perjalanan menuju Ecosystem v1.1
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {timeline.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="text-xs font-semibold text-[color:var(--gv-accent)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
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
                North Star
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Create, Automate, Monetize, Manage
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {northStar.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Values
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Prinsip yang menjaga fokus kami
                </h2>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {values.map((item) => (
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

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Siap melangkah bersama Gigaviz?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai sekarang untuk merapikan workflow tim Anda.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Mulai Sekarang
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Pricing
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
