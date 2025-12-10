import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Beranda Gigaviz: ringkasan ekosistem digital dari WA Blast, dashboard kinerja, musik, dan tools kreatif.",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gigaviz-bg via-slate-950 to-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-800/60">
          <div className="container flex flex-col gap-10 py-16 md:flex-row md:items-center md:py-24">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Ekosistem Digital Glorious Victorious
              </div>

              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
                  Satu ekosistem, banyak produk digital.
                </h1>
                <p className="text-pretty text-sm text-slate-300 md:text-base">
                  Gigaviz menghubungkan WA Blast, dashboard kinerja, musik,
                  dan tools kreatif dalam satu identitas brand. Dirancang untuk
                  tim yang ingin bekerja lebih rapi, terukur, dan tetap
                  manusiawi.
                </p>
              </div>

              {/* CTA pakai Button */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Button href="/products">
                  Lihat produk
                </Button>
                <Button href="/contact" variant="ghost">
                  Diskusi kebutuhan Anda
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                Saat ini: WA Blast terintegrasi, dashboard kinerja, dan musik
                Gigaviz Tracks. Fitur lain menyusul secara bertahap.
              </p>
            </div>

            <div className="flex-1">
              <div className="mx-auto h-64 max-w-md rounded-3xl border border-slate-800 bg-slate-950/60 p-4 shadow-xl shadow-cyan-500/10 md:h-80">
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  Area visual: mockup dashboard / WA Blast / logo Gigaviz
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section produk singkat */}
        <section className="border-b border-slate-800/60 bg-slate-950/40">
          <div className="container grid gap-6 py-12 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                WA Blast & Notifikasi
              </h2>
              <p className="text-xs text-slate-400">
                Broadcast pengingat pembayaran, info layanan, dan kampanye
                pelanggan via WhatsApp Business yang terstruktur.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                Dashboard Kinerja
              </h2>
              <p className="text-xs text-slate-400">
                Monitoring kinerja tim harian sampai bulanan dengan visual
                sederhana dan metrik yang jelas.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                Gigaviz Tracks
              </h2>
              <p className="text-xs text-slate-400">
                Musik orisinal untuk brand, konten, atau personal project,
                dirilis di platform digital.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
