import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import LeadForm from "@/components/wa/lead-form";

export const metadata: Metadata = {
  title: "WA Platform",
  description:
    "Platform WhatsApp Bisnis All-in-One berbasis WhatsApp Cloud API (resmi): broadcast, campaign, inbox CS, template, analitik, dan laporan.",
};

const features = [
  {
    title: "Broadcast & Campaign",
    desc: "Jalankan notifikasi dan kampanye dengan jadwal, segmentasi, serta throttling aman agar lebih stabil.",
  },
  {
    title: "Inbox CS Multi Agen",
    desc: "Kelola percakapan pelanggan dengan alur kerja CS yang lebih rapi dan konsisten.",
  },
  {
    title: "Chatbot & Automasi",
    desc: "Otomasi respon dasar dan alur FAQ untuk membantu tim fokus pada kasus prioritas.",
  },
  {
    title: "Template Pesan Resmi",
    desc: "Dukungan best practice compliance: opt-in, STOP/opt-out, dan penyusunan template pesan.",
  },
  {
    title: "Analitik & Laporan",
    desc: "Pantau status pengiriman, performa kampanye, dan data lead masuk untuk evaluasi yang jelas.",
  },
  {
    title: "Integrasi Data",
    desc: "Sumber data dari Excel/CSV/Google Sheets (opsional) dengan validasi dan logging yang rapi.",
  },
];

const steps = [
  {
    title: "Konsultasi kebutuhan",
    desc: "Tentukan tujuan (notifikasi, CS, campaign) dan sumber data yang digunakan.",
  },
  {
    title: "Setup & konfigurasi",
    desc: "Konfigurasi Cloud API, nomor admin, template (bila perlu), serta parameter throttling aman.",
  },
  {
    title: "Uji coba terkontrol",
    desc: "Mode uji + sample pengiriman untuk memastikan alur & log sudah sesuai.",
  },
  {
    title: "Go-live bertahap",
    desc: "Naikkan volume secara bertahap sambil memantau delivery & feedback pelanggan.",
  },
];

const useCases = [
  "Pengingat tagihan & notifikasi layanan",
  "Broadcast informasi pelanggan (tersegmentasi)",
  "Follow-up leads & campaign promosi",
  "CS berbasis inbox terpusat + template balasan",
  "Laporan pengiriman & monitoring operasional",
];

const faqs = [
  {
    q: "Apakah ini menggunakan jalur resmi WhatsApp?",
    a: "Ya. Fokus utama WA Platform adalah WhatsApp Cloud API (resmi) untuk kebutuhan broadcast, CS, dan automasi.",
  },
  {
    q: "Apakah bisa kirim 500–1000 pesan per hari?",
    a: "Bisa untuk use-case tertentu. Kami menerapkan batas pengiriman, jeda aman, kualitas opt-in, serta pemantauan delivery untuk menjaga stabilitas.",
  },
  {
    q: "Bagaimana soal compliance (spam/opt-out)?",
    a: "Kami mendorong daftar kontak berbasis opt-in. Setiap kampanye menerapkan prinsip STOP/opt-out, throttling, serta pengelolaan template agar lebih aman.",
  },
  {
    q: "Sumber data bisa dari Excel/Google Sheets?",
    a: "Bisa. Umumnya dari Excel/CSV, dan dapat dikembangkan untuk sinkronisasi Google Sheets sesuai kebutuhan.",
  },
];

export default function WAPlatformPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gigaviz-bg">
      <Navbar />

      <main className="flex-1 border-b border-slate-800/60">
        {/* HERO */}
        <section className="border-b border-slate-800/60">
          <div className="container grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Platform WhatsApp Bisnis All-in-One
              </div>

              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl lg:text-5xl">
                  Broadcast, CS, dan automasi WhatsApp dalam satu dashboard
                </h1>
                <p className="text-pretty text-sm text-slate-300 md:text-base">
                  WA Platform dirancang untuk operasional yang rapi: ada throttling aman, log sukses/gagal, retry terbatas,
                  serta best practice compliance (opt-in & STOP/opt-out). Fokus utama menggunakan{" "}
                  <b>WhatsApp Cloud API (resmi)</b>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="#demo"
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
                >
                  Request Demo
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  Lihat Paket
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  Konsultasi
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Opt-in / persetujuan pelanggan
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  STOP / opt-out
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Batas kirim & jeda aman
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Log sukses/gagal
                </span>
              </div>
            </div>

            {/* FORM (atas) */}
            <div id="demo">
              <LeadForm />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="bg-slate-950/30 border-b border-slate-800/60">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-semibold text-slate-100">
                Fitur utama yang paling sering dipakai
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Fokus pada operasional harian: pengiriman lebih stabil, lebih terukur, dan lebih mudah dipantau.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="text-sm font-semibold text-slate-100">
                    {f.title}
                  </div>
                  <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {f.desc}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
              >
                Lihat Paket
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-b border-slate-800/60">
          <div className="container py-12 md:py-16">
            <div className="grid gap-10 md:grid-cols-2 md:items-start">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">
                  Cara kerja implementasi
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Proses dibuat sederhana agar cepat jalan dan tetap aman.
                </p>

                <div className="mt-6 space-y-3">
                  {steps.map((s, idx) => (
                    <div
                      key={s.title}
                      className="rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-2xl bg-cyan-400/10 text-xs font-bold text-cyan-200 ring-1 ring-cyan-400/20">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">
                            {s.title}
                          </div>
                          <div className="mt-1 text-sm text-slate-300 leading-relaxed">
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs text-cyan-200">Use-case</div>
                <h4 className="mt-1 text-lg font-semibold text-slate-100">
                  Cocok untuk
                </h4>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {useCases.map((u) => (
                    <li key={u} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300/80" />
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100/90">
                  <b>Catatan compliance:</b> kami mendorong daftar kontak berbasis opt-in. Setiap kampanye menerapkan
                  batas pengiriman & jeda aman, serta mekanisme STOP/opt-out.
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/pricing"
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-700/70 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
                  >
                    Lihat Paket
                  </Link>
                  <Link
                    href="#demo"
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
                  >
                    Request Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-950/30">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl">
              <h3 className="text-xl font-semibold text-slate-100">FAQ</h3>
              <p className="mt-2 text-sm text-slate-300">
                Pertanyaan yang paling sering ditanyakan sebelum implementasi.
              </p>

              <div className="mt-6 space-y-3">
                {faqs.map((f) => (
                  <div
                    key={f.q}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6"
                  >
                    <div className="font-semibold text-slate-100">{f.q}</div>
                    <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                      {f.a}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold text-slate-100">
                  Siap melihat demo?
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  Isi form demo — kami akan menyesuaikan rekomendasi berdasarkan kebutuhan Anda.
                </div>
                <div className="mt-4">
                  <Link
                    href="#demo"
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
                  >
                    Request Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORM (bawah) */}
        <section className="border-t border-slate-800/60">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl">
              <LeadForm />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
