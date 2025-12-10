import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Produk | Gigaviz",
  description:
    "Daftar produk dalam ekosistem Gigaviz: WA Blast & Notifikasi, Dashboard Kinerja, dan Gigaviz Tracks untuk kebutuhan komunikasi, monitoring, dan branding kreatif.",
};

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gigaviz-bg via-slate-950 to-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-800/60">
          <div className="container space-y-6 py-16 md:py-24">
            <div className="space-y-3 md:max-w-2xl">
              <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Produk yang saling terhubung, bukan berdiri sendiri.
              </h1>
              <p className="text-sm text-slate-300 md:text-base">
                Gigaviz berisi beberapa produk kecil yang bisa digunakan
                terpisah, namun akan terasa maksimal ketika saling terintegrasi.
                Mulai dari pengingat pembayaran, membaca kinerja tim, sampai
                membangun identitas brand melalui musik.
              </p>
            </div>

            <p className="text-xs text-slate-500">
              Pilih satu produk untuk mulai, atau kombinasikan beberapa
              sekaligus sesuai kebutuhan tim Anda.
            </p>
          </div>
        </section>

        {/* List produk */}
        <section className="border-b border-slate-800/60 bg-slate-950/40">
          <div className="container space-y-6 py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-3">
              {/* WA Blast */}
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h2 className="mb-1 text-sm font-semibold text-slate-50">
                  WA Blast & Notifikasi
                </h2>
                <p className="mb-3 text-xs text-slate-400">
                  Kirim pengingat pembayaran, informasi layanan, dan kampanye
                  terjadwal melalui WhatsApp Business dengan template yang
                  konsisten.
                </p>
                <ul className="mb-4 flex-1 space-y-1.5 text-xs text-slate-300">
                  <li>• Template pesan yang rapi dan terukur.</li>
                  <li>• Segmentasi dasar: pelanggan aktif, tertunggak, dsb.</li>
                  <li>• Log pengiriman untuk keperluan monitoring.</li>
                </ul>
                <p className="mb-3 text-[11px] text-slate-500">
                  Cocok untuk: tim penagihan, layanan pelanggan, dan kampanye
                  informasi berkala.
                </p>
                <Link
                  href="/contact"
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Diskusikan implementasi WA Blast →
                </Link>
              </div>

              {/* Dashboard Kinerja */}
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h2 className="mb-1 text-sm font-semibold text-slate-50">
                  Dashboard Kinerja
                </h2>
                <p className="mb-3 text-xs text-slate-400">
                  Visual sederhana untuk melihat perkembangan kinerja tim harian
                  sampai bulanan – lengkap dengan target dan pencapaiannya.
                </p>
                <ul className="mb-4 flex-1 space-y-1.5 text-xs text-slate-300">
                  <li>• Rekap progress per orang dan per tim.</li>
                  <li>• Highlight siapa yang perlu bantuan atau perhatian.</li>
                  <li>• Bisa dikombinasikan dengan data dari WA Blast.</li>
                </ul>
                <p className="mb-3 text-[11px] text-slate-500">
                  Cocok untuk: koordinator tim lapangan, supervisor, dan
                  manajer yang butuh overview cepat.
                </p>
                <Link
                  href="/contact"
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Lihat contoh dashboard & metriks →
                </Link>
              </div>

              {/* Gigaviz Tracks */}
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h2 className="mb-1 text-sm font-semibold text-slate-50">
                  Gigaviz Tracks
                </h2>
                <p className="mb-3 text-xs text-slate-400">
                  Musik original untuk brand, konten, atau project personal yang
                  ingin punya nuansa khas – dari tema produktivitas sampai
                  storytelling keluarga.
                </p>
                <ul className="mb-4 flex-1 space-y-1.5 text-xs text-slate-300">
                  <li>• Lagu khusus untuk video internal atau campaign.</li>
                  <li>• Musik latar untuk konten sosial media.</li>
                  <li>• Project personal yang ingin dirilis ke platform digital.</li>
                </ul>
                <p className="mb-3 text-[11px] text-slate-500">
                  Cocok untuk: kreator konten, brand kecil, maupun individu yang
                  ingin mengabadikan cerita lewat musik.
                </p>
                <Link
                  href="/contact"
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Bahas ide lagu atau project audio →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Callout integrasi */}
        <section className="border-b border-slate-800/60">
          <div className="container py-12 md:py-16">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 md:flex md:items-center md:justify-between md:gap-8">
              <div className="space-y-2 md:max-w-xl">
                <h2 className="text-sm font-semibold text-slate-50">
                  Tidak tahu harus mulai dari produk yang mana?
                </h2>
                <p className="text-xs text-slate-400 md:text-[13px]">
                  Santai. Kita bisa mulai dari sesi singkat untuk memahami
                  kebutuhan dan alur kerja tim Anda, lalu pilih kombinasi
                  produk yang paling masuk akal untuk tahap awal.
                </p>
              </div>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center rounded-2xl bg-cyan-400 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm hover:bg-cyan-300 md:mt-0"
              >
                Jadwalkan obrolan singkat
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
