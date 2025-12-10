import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Catatan singkat seputar pengembangan produk dan update ekosistem Gigaviz.",
};

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gigaviz-bg">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-slate-800/60">
          <div className="container space-y-3 py-12 md:py-16">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Blog & Update
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Di sini nanti berisi catatan pendek tentang perubahan fitur,
              eksperimen, dan cerita di balik ekosistem Gigaviz.
            </p>
            <p className="text-xs text-slate-500">
              Belum ada artikel. Konten akan ditambahkan secara bertahap.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
