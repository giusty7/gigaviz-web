import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Hubungi Gigaviz untuk diskusi kebutuhan WA Blast, dashboard, atau produk digital lainnya.",
};

const WHATSAPP_NUMBER = "6283165655670"; // GANTI NOMOR INI JIKA PERLU

export default function ContactPage() {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Halo Gigaviz, saya ingin diskusi soal layanan/produk."
  )}`;

  return (
    <div className="flex min-h-screen flex-col bg-gigaviz-bg">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-slate-800/60">
          <div className="container grid gap-10 py-12 md:grid-cols-[1.2fr,1fr] md:py-16">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Kontak & Kolaborasi
              </h1>
              <p className="max-w-xl text-sm text-slate-300">
                Kirim pesan singkat mengenai kebutuhan Anda. Ceritakan konteks,
                skala tim, dan tujuan yang ingin dicapai. Kami akan merespons
                seefisien mungkin.
              </p>

              <div className="space-y-2 text-sm text-slate-300">
                <p className="font-semibold text-slate-100">
                  Cara tercepat: WhatsApp
                </p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm hover:bg-emerald-400"
                >
                  Chat via WhatsApp Business
                </a>
                <p className="text-xs text-slate-500">
                  *Tombol di atas akan membuka WhatsApp dengan template pesan
                  awal.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
              <p className="mb-2 font-semibold">
                Contoh informasi yang bisa Anda kirim:
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Jenis kebutuhan (WA Blast, dashboard, musik, dll)</li>
                <li>Jumlah tim/pelanggan yang terlibat</li>
                <li>Target utama (monitoring, pengingat, branding, dll)</li>
                <li>Perkiraan waktu mulai yang diharapkan</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
