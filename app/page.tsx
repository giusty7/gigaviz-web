import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Gigaviz Services: WA Platform berbasis WhatsApp Cloud API (resmi) untuk broadcast, CS, dan automasi — plus ekosistem produk digital Gigaviz.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gigaviz-bg via-slate-950 to-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="border-b border-slate-800/60">
          <div className="container flex flex-col gap-10 py-16 md:flex-row md:items-center md:py-24">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Fokus utama: WhatsApp Cloud API (resmi)
              </div>

              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
                  Kelola WhatsApp bisnis lebih rapi, terukur, dan scalable.
                </h1>
                <p className="text-pretty text-sm text-slate-300 md:text-base">
                  Gigaviz membantu bisnis menjalankan <b>broadcast</b>,{" "}
                  <b>campaign</b>, dan <b>notifikasi</b> via{" "}
                  <b>WhatsApp Cloud API</b> — lengkap dengan throttling aman,
                  log sukses/gagal, dan best practice compliance.
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/wa-platform"
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-cyan-300"
                >
                  Request Demo
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 bg-transparent px-5 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
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

              {/* Trust / Compliance */}
              <div className="space-y-2">
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
                <p className="text-xs text-slate-500">
                  Catatan: layanan hanya untuk kontak yang memberi persetujuan (opt-in). Kami
                  menerapkan batas pengiriman & jeda aman untuk menjaga kualitas pengiriman.
                </p>
              </div>
            </div>

            {/* Visual */}
            <div className="flex-1">
              <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-cyan-500/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-cyan-200">Preview</div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      Dashboard & Log Pengiriman
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Monitoring kampanye, status pengiriman, dan lead masuk.
                    </div>
                  </div>
                  <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 ring-1 ring-cyan-400/20">
                    WA Platform
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Status hari ini</div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-200">Terkirim</span>
                      <span className="font-semibold text-slate-100">—</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-200">Gagal</span>
                      <span className="font-semibold text-slate-100">—</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-200">Lead masuk</span>
                      <span className="font-semibold text-slate-100">—</span>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-500">
                      (Placeholder) — bisa diganti screenshot asli kagek.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Action cepat</div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Link
                        href="/wa-platform"
                        className="inline-flex flex-1 items-center justify-center rounded-2xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-900 hover:bg-cyan-300"
                      >
                        Buka WA Platform
                      </Link>
                      <Link
                        href="/pricing"
                        className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-700/70 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
                      >
                        Lihat Paket
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY / BENEFITS */}
        <section className="border-b border-slate-800/60 bg-slate-950/40">
          <div className="container grid gap-6 py-12 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                Broadcast & Campaign
              </h2>
              <p className="text-xs text-slate-400">
                Kirim notifikasi & info pelanggan dengan jadwal, segmentasi,
                dan jeda aman agar pengiriman lebih stabil.
              </p>
              <div className="mt-4">
                <Link
                  href="/wa-platform"
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline"
                >
                  Lihat fitur WA Platform →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                Inbox CS & Automasi
              </h2>
              <p className="text-xs text-slate-400">
                Siapkan alur CS, template pesan, dan automasi dasar agar respon
                lebih cepat dan konsisten.
              </p>
              <div className="mt-4">
                <Link
                  href="/pricing"
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline"
                >
                  Cek paket & opsi implementasi →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                Laporan & Monitoring
              </h2>
              <p className="text-xs text-slate-400">
                Pantau performa pengiriman, status sukses/gagal, dan data lead
                masuk untuk evaluasi kampanye.
              </p>
              <div className="mt-4">
                <Link
                  href="/admin/leads"
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline"
                >
                  Buka dashboard leads →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem (tetap ada, tapi sekunder) */}
        <section className="bg-slate-950/20">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-xl font-semibold text-slate-100">
                Ekosistem Gigaviz (sekunder)
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Selain WA Platform, Gigaviz juga mengembangkan dashboard kinerja, tools kreatif,
                dan rilis musik melalui Gigaviz Tracks.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  Lihat Produk Lainnya
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  Diskusi Kebutuhan
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
