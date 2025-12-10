import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Tentang | Gigaviz",
  description:
    "Cerita singkat tentang Gigaviz: ekosistem digital yang menghubungkan WA Blast, dashboard kinerja, dan musik untuk tim yang ingin bekerja lebih rapi dan terukur.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gigaviz-bg via-slate-950 to-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-800/60">
          <div className="container space-y-6 py-16 md:py-24">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">
              Tentang Gigaviz
            </p>
            <div className="space-y-4 md:max-w-3xl">
              <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Ekosistem kecil yang lahir dari kebutuhan kerja sehari-hari.
              </h1>
              <p className="text-sm text-slate-300 md:text-base">
                Gigaviz berawal dari kebutuhan sederhana: bagaimana cara
                mengelola pengingat pembayaran, memantau kinerja tim di
                lapangan, dan tetap punya ruang untuk berkarya lewat musik –
                tanpa harus loncat-loncat antar aplikasi dan file yang
                berantakan.
              </p>
              <p className="text-sm text-slate-300 md:text-base">
                Dari situ lahir ide untuk menyatukan beberapa produk kecil
                menjadi satu ekosistem digital yang rapi, terukur, dan tetap
                manusiawi. Fokusnya bukan sekadar teknologi, tapi membantu tim
                bekerja lebih tenang dan pelanggan merasa lebih diperhatikan.
              </p>
            </div>
          </div>
        </section>

        {/* Nilai & pendekatan */}
        <section className="border-b border-slate-800/60 bg-slate-950/40">
          <div className="container grid gap-6 py-12 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                Praktis untuk tim sibuk
              </h2>
              <p className="text-xs text-slate-400">
                Setiap fitur dirancang dari sudut pandang tim lapangan dan
                koordinator. Bukan dashboard yang penuh hiasan, tapi alat kerja
                yang benar-benar terpakai setiap hari.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                Data yang bisa ditindaklanjuti
              </h2>
              <p className="text-xs text-slate-400">
                Angka dan grafik dibuat sesederhana mungkin, supaya mudah
                dibaca dan langsung bisa diambil keputusan – siapa butuh
                bantuan, siapa yang sudah on track, dan apa prioritas berikutnya.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-50">
                Sentuhan kreatif
              </h2>
              <p className="text-xs text-slate-400">
                Musik dan identitas visual di dalam Gigaviz bukan sekadar
                pelengkap. Ini cara kami menjaga semangat tim dan membangun
                brand yang terasa lebih dekat, hangat, dan hidup.
              </p>
            </div>
          </div>
        </section>

        {/* Cara kerja singkat */}
        <section className="border-b border-slate-800/60">
          <div className="container grid gap-10 py-12 md:grid-cols-[1.3fr_minmax(0,1fr)] md:py-16">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
                Cara kami bekerja dengan Anda
              </h2>
              <ol className="space-y-3 text-sm text-slate-300">
                <li>
                  <span className="font-semibold text-cyan-400">
                    1. Pahami konteks dulu
                  </span>
                  <br />
                  Mulai dari obrolan ringan tentang kondisi tim Anda sekarang,
                  tantangan di lapangan, dan target yang ingin dicapai.
                </li>
                <li>
                  <span className="font-semibold text-cyan-400">
                    2. Pilih produk yang paling relevan
                  </span>
                  <br />
                  Tidak harus langsung ambil semua. Bisa mulai dari WA Blast
                  dulu, atau dashboard kinerja dulu – disesuaikan dengan
                  kebutuhan.
                </li>
                <li>
                  <span className="font-semibold text-cyan-400">
                    3. Iterasi pelan tapi pasti
                  </span>
                  <br />
                  Setelah berjalan, kita lihat lagi data dan perilaku pengguna.
                  Dari sana kita perbaiki template, alur kerja, atau laporan
                  supaya makin pas.
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-xs text-slate-400">
              <p className="mb-2 font-semibold text-slate-100">
                Singkatnya, Gigaviz adalah:
              </p>
              <ul className="space-y-2">
                <li>• Teman koordinasi kerja, bukan sekadar aplikasi.</li>
                <li>• Jembatan antara data, tim, dan pelanggan.</li>
                <li>
                  • Ruang kecil untuk terus bereksperimen dengan ide-ide baru.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
