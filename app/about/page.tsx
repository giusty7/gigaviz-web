import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Tentang",
  description:
    "Tentang Gigaviz dan Glorious Victorious sebagai ekosistem produk digital.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gigaviz-bg">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-slate-800/60">
          <div className="container space-y-4 py-12 md:py-16">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Tentang Gigaviz
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Gigaviz adalah rumah dari berbagai produk digital yang lahir
              dari kebutuhan lapangan: dari mengelola tim, mengingatkan
              pelanggan, sampai menyalurkan karya musik. Semua berada di
              bawah payung Glorious Victorious.
            </p>
            <p className="max-w-2xl text-sm text-slate-300">
              Fokus kami adalah membuat solusi yang praktis, mudah dipahami,
              dan realistis untuk digunakan sehari-hari. Bukan hanya tampilan
              yang indah, tetapi juga alur kerja yang jelas dan bisa diukur.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
