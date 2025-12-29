import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Paket layanan Gigaviz untuk WhatsApp Cloud API (resmi) dan pendamping operasional (by request).",
};

const bullets = {
  api: [
    "Berbasis WhatsApp Cloud API (jalur resmi)",
    "Broadcast & campaign dengan throttling aman",
    "Template pesan resmi (opsional) + best practice compliance",
    "Log pengiriman (sukses/gagal) + retry terbatas",
    "Segmentasi kontak & jadwal kirim (opsional)",
    "Onboarding & SOP (opt-in, STOP/opt-out, batas harian)",
  ],
  ops: [
    "Workflow pendamping untuk kebutuhan khusus/internal",
    "Dijalankan berdasarkan evaluasi use-case (By Request)",
    "Mengutamakan kepatuhan, opt-in, dan batas pengiriman aman",
    "Cocok sebagai pelengkap proses operasional tertentu",
    "Tidak menggantikan WhatsApp Cloud API",
  ],
};

const faqs = [
  {
    q: "Apa bedanya paket Cloud API dan Pendamping Operasional?",
    a: "Cloud API adalah jalur resmi dan paling aman untuk skala bisnis. Pendamping operasional bersifat terbatas/by request untuk kebutuhan khusus setelah evaluasi.",
  },
  {
    q: "Apakah bisa kirim 500–1000 pesan per hari?",
    a: "Bisa untuk use-case tertentu, dengan penerapan batas harian, jeda aman, kualitas opt-in, serta pemantauan delivery. Rekomendasi utama: Cloud API.",
  },
  {
    q: "Apakah layanan ini sesuai kebijakan WhatsApp?",
    a: "Kami mendorong penggunaan jalur resmi (Cloud API) dan menerapkan prinsip compliance: opt-in, opt-out (STOP), serta pembatasan pengiriman untuk menghindari spam.",
  },
  {
    q: "Apakah ada trial / demo?",
    a: "Ada. Anda bisa request demo untuk melihat alur, dashboard/log, dan rekomendasi implementasi sesuai kebutuhan.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gigaviz-bg">
      <Navbar />

      <main className="flex-1 border-b border-slate-800/60">
        {/* Hero */}
        <section className="container py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-cyan-300/80" />
              Paket & Harga
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
              Pilih paket yang paling cocok untuk operasional WhatsApp bisnis Anda
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
              Fokus utama kami adalah implementasi <b>WhatsApp Cloud API (resmi)</b> untuk kebutuhan
              broadcast, CS, dan automasi yang aman serta scalable.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Link
                href="/wa-platform"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-cyan-300 sm:w-auto"
              >
                Request Demo
              </Link>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700/70 bg-transparent px-5 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200 sm:w-auto"
              >
                Konsultasi via Kontak
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Catatan: layanan hanya untuk kontak yang <b>memberi persetujuan (opt-in)</b>. Setiap kampanye
              menerapkan <b>batas pengiriman & jeda aman</b>. Opt-out tersedia dengan perintah <b>STOP</b>.
            </p>
          </div>
        </section>

        {/* Cards */}
        <section className="container pb-12 md:pb-16">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cloud API */}
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6 ring-1 ring-cyan-400/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-cyan-200">Rekomendasi Utama</div>
                  <h2 className="mt-1 text-xl font-semibold text-slate-100">
                    WhatsApp Cloud API (Resmi)
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Untuk broadcast & automasi dengan jalur resmi, lebih stabil dan lebih aman untuk skala bisnis.
                  </p>
                </div>
                <span className="rounded-full bg-cyan-400 px-2.5 py-1 text-[11px] font-semibold text-slate-900">
                  Best Choice
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-400">Harga</div>
                <div className="mt-1 text-2xl font-semibold text-slate-100">
                  Custom / sesuai kebutuhan
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Ditentukan dari volume, fitur, dan kebutuhan integrasi.
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-slate-200">
                {bullets.api.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300/80" />
                    <span className="text-slate-300">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/wa-platform"
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
                >
                  Request Demo
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  Tanya Paket
                </Link>
              </div>
            </div>

            {/* Ops By Request */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">By Request</div>
                  <h2 className="mt-1 text-xl font-semibold text-slate-100">
                    Pendamping Operasional
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Pendekatan pendamping untuk kebutuhan khusus/internal, setelah evaluasi kelayakan.
                  </p>
                </div>
                <span className="rounded-full border border-slate-600/60 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                  Limited
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-400">Harga</div>
                <div className="mt-1 text-2xl font-semibold text-slate-100">
                  Evaluasi dulu
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Ketersediaan tergantung use-case & kebutuhan.
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-slate-200">
                {bullets.ops.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-slate-400/70" />
                    <span className="text-slate-300">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-100/90">
                <b>Catatan:</b> pendekatan ini tidak menggantikan Cloud API dan tidak menjamin bebas pembatasan WhatsApp.
                Direkomendasikan hanya untuk use-case tertentu setelah evaluasi.
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/15"
                >
                  Ajukan Kebutuhan
                </Link>
                <Link
                  href="/wa-platform"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  Lihat WA Platform
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container pb-14 md:pb-20">
          <div className="mx-auto max-w-3xl">
            <h3 className="text-xl font-semibold text-slate-100">FAQ</h3>
            <p className="mt-2 text-sm text-slate-300">
              Jawaban cepat untuk pertanyaan yang paling sering ditanyakan.
            </p>

            <div className="mt-6 space-y-3">
              {faqs.map((f) => (
                <div
                  key={f.q}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="font-semibold text-slate-100">{f.q}</div>
                  <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {f.a}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row">
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  Siap mulai?
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  Request demo untuk lihat alur, log, dan rekomendasi implementasi.
                </div>
              </div>
              <Link
                href="/wa-platform"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
