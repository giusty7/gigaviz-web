import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import MediaKitCopyBlock from "@/components/marketing/media-kit-copy";
import MediaKitLogos from "@/components/marketing/media-kit-logos";

export const metadata: Metadata = {
  title: "Media Kit Gigaviz",
  description:
    "Aset resmi brand Gigaviz untuk press, partner, dan komunitas.",
  alternates: {
    canonical: "/media-kit",
  },
  openGraph: {
    title: "Media Kit Gigaviz",
    description:
      "Aset resmi brand Gigaviz untuk press, partner, dan komunitas.",
    url: "/media-kit",
  },
};

const brandSummary = [
  "Gigaviz adalah ekosistem SaaS untuk Create -> Automate -> Monetize -> Manage.",
  "Indonesia-first dan global-ready, dengan pendekatan modular.",
  "Security-first: kontrol akses, audit, dan pemisahan workspace.",
  "Dioperasikan oleh PT Gigaviz Digital Indonesia.",
];

const logoAssets = [
  {
    label: "Logo Horizontal",
    file: "/brand/gigaviz-logo-horizontal.png",
    width: 420,
    height: 120,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Logo Stacked",
    file: "/brand/gigaviz-logo-stacked.png",
    width: 260,
    height: 260,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Mark",
    file: "/brand/gigaviz-mark.png",
    width: 160,
    height: 160,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Mark Gold",
    file: "/brand/gigaviz-mark-gold.png",
    width: 160,
    height: 160,
    previewClass: "bg-[#0b1220]",
  },
  {
    label: "Mark Dark",
    file: "/brand/gigaviz-mark-dark.png",
    width: 160,
    height: 160,
    previewClass: "bg-white",
  },
  {
    label: "Mark Mono",
    file: "/brand/gigaviz-mark-mono.png",
    width: 160,
    height: 160,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
];

const palette = [
  { name: "Gold", hex: "#d6b25e" },
  { name: "Navy", hex: "#0b1220" },
  { name: "Magenta", hex: "#e24ba8" },
  { name: "Cream", hex: "#f7f1e7" },
];

const copyBlocks = [
  {
    title: "Deskripsi Singkat (50 kata)",
    text:
      "Gigaviz adalah ekosistem SaaS yang menyatukan modul create, automate, monetize, dan manage dalam satu akun. " +
      "Dirancang Indonesia-first dan siap skala global, Gigaviz membantu tim bekerja cepat tanpa kehilangan kontrol, keamanan, " +
      "dan visibilitas, melalui workspace, billing, dan audit yang konsisten untuk operasional, kreatif, dan komunikasi pelanggan " +
      "sehingga keputusan lebih terukur harian.",
  },
  {
    title: "Deskripsi Standar (150 kata)",
    text:
      "Gigaviz adalah ekosistem produk digital yang membantu bisnis, kreator, dan tim operasional menjalankan proses end-to-end: " +
      "Create, Automate, Monetize, dan Manage. Dengan satu akun dan satu workspace, tim dapat mengaktifkan modul seperti Core OS " +
      "untuk identitas dan billing, Meta Hub untuk WhatsApp Cloud API, Helper untuk AI, Office untuk dokumen, Studio untuk aset " +
      "kreatif, serta Marketplace, Arena, Apps, Pay, dan Community sebagai lapisan pertumbuhan. Pendekatan Indonesia-first " +
      "memastikan kebutuhan lokal terpenuhi, sementara arsitektur modular membuatnya siap berkembang ke level global. Keamanan " +
      "menjadi fondasi: kontrol akses berbasis peran, audit log, dan pemisahan data per workspace. Gigaviz dioperasikan oleh " +
      "PT Gigaviz Digital Indonesia dan fokus pada hasil yang terukur - membantu tim bergerak cepat tanpa kehilangan kontrol. " +
      "Kami menyediakan status rilis yang transparan (Live, Beta, Segera) agar partner bisa merencanakan implementasi. Setiap " +
      "modul dirancang untuk saling terhubung, sehingga data, hak akses, dan biaya dapat dipantau dari satu dashboard dengan " +
      "laporan ringkas dan audit berkala.",
  },
  {
    title: "Tagline",
    text: "Ekosistem Digital Terpadu untuk Create -> Automate -> Monetize -> Manage.",
  },
];

export default function MediaKitPage() {
  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[color:var(--gv-border)]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,178,94,0.22),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(226,75,168,0.18),_transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(247,241,231,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(247,241,231,0.08) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
          </div>

          <div className="container relative z-10 py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Media Kit
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Media Kit Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Aset resmi brand untuk press, partner, dan komunitas.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a
                  href="#logos"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Unduh Logo
                </a>
                <a
                  href="#copy"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Copy Deskripsi
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Ringkasan brand
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Gigaviz secara singkat
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {brandSummary.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  North Star
                </div>
                <div className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
                  Create -&gt; Automate -&gt; Monetize -&gt; Manage
                </div>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                  Empat pilar yang mengarahkan desain modul dan pengalaman pengguna.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="logos" className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Logo assets
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Unduh logo resmi
                </h2>
              </div>
              <div className="text-xs text-[color:var(--gv-muted)]">
                File tersedia dalam format PNG.
              </div>
            </div>

            <MediaKitLogos items={logoAssets} />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Panduan penggunaan
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>Jaga clear space minimal setara tinggi huruf G.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>Jangan diputar, direnggangkan, atau diberi efek tambahan.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>Gunakan mark untuk ukuran kecil, logo horizontal untuk header.</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Variasi latar
                </div>
                <p className="mt-4">
                  Gunakan varian gold untuk latar gelap, dan varian dark untuk latar terang.
                  Jika ragu, gunakan logo horizontal di latar navy dengan kontras tinggi.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Warna resmi
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Palet warna Gigaviz
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Warna di bawah ini mengikuti token desain Gigaviz di UI saat ini.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {palette.map((color) => (
                  <div
                    key={color.name}
                    className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4"
                  >
                    <div
                      className="h-16 w-full rounded-2xl border border-[color:var(--gv-border)]"
                      style={{ backgroundColor: color.hex }}
                      aria-label={`${color.name} ${color.hex}`}
                    />
                    <div className="mt-3 text-sm font-semibold text-[color:var(--gv-text)]">
                      {color.name}
                    </div>
                    <div className="text-xs text-[color:var(--gv-muted)]">
                      {color.hex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Tipografi
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Font utama Gigaviz
                </h2>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p>
                  Primary font: Plus Jakarta Sans (teks dan UI).
                </p>
                <p className="mt-2">
                  Display font: Playfair Display (judul utama).
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="copy" className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Copy resmi
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Deskripsi dan tagline siap pakai
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Gunakan deskripsi berikut untuk press release, partner deck, atau katalog produk.
              </p>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {copyBlocks.map((item) => (
                <MediaKitCopyBlock key={item.title} title={item.title} text={item.text} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Founder & contact
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Kontak resmi Gigaviz
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Founder: Giusty Adhyarachmat Eryan (Giusty).
                </p>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Business entity: PT Gigaviz Digital Indonesia.
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p>
                  Untuk pertanyaan media, silakan hubungi kami melalui halaman Contact.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Buka Contact
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Siap memperkenalkan Gigaviz?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Unduh aset, gunakan copy resmi, dan jelajahi modul kami.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Mulai
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Produk
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
