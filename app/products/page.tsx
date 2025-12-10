import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Produk",
  description:
    "Daftar produk dan layanan dalam ekosistem Gigaviz: WA Blast, dashboard kinerja, musik, dan lainnya.",
};

const products = [
  {
    name: "Gigaviz WA Blast",
    badge: "Layanan",
    desc: "Pengiriman pesan massal terstruktur untuk pengingat pembayaran, informasi layanan, dan edukasi pelanggan.",
    status: "Aktif",
  },
  {
    name: "Gigaviz Office (Dashboard)",
    badge: "Layanan",
    desc: "Dashboard kinerja tim harian/bulanan dengan integrasi Google Sheets atau database lain.",
    status: "Aktif",
  },
  {
    name: "Gigaviz Tracks",
    badge: "Kreatif",
    desc: "Produksi dan distribusi musik orisinal untuk brand, konten, dan personal project.",
    status: "Aktif",
  },
  {
    name: "Gigaviz APK",
    badge: "Dev",
    desc: "Pengembangan aplikasi Android internal, terutama untuk operasional lapangan dan monitoring.",
    status: "Dalam pengembangan",
  },
];

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gigaviz-bg">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-slate-800/60">
          <div className="container py-12 md:py-16">
            <div className="mb-6 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Produk & Layanan
              </h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Beberapa produk dapat digunakan secara terpisah, namun tetap
                saling terhubung di bawah satu identitas brand.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {products.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold text-slate-50">
                        {item.name}
                      </h2>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <div className="mt-3 text-[11px] text-cyan-300">
                    Status: {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
