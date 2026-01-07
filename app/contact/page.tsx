import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Hubungi Gigaviz",
  description:
    "Hubungi Gigaviz untuk partnership, pertanyaan produk, atau kebutuhan dukungan.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Hubungi Gigaviz",
    description:
      "Hubungi Gigaviz untuk partnership, pertanyaan produk, atau kebutuhan dukungan.",
    url: "/contact",
  },
};

const contactNotes = [
  "Sertakan tujuan utama dan konteks bisnis Anda.",
  "Ceritakan skala tim dan target yang ingin dicapai.",
  "Jika butuh press kit, gunakan Media Kit resmi.",
];

export default function ContactPage() {
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
                Kontak
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Hubungi Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Kirim pertanyaan atau kebutuhan Anda, tim kami akan merespons secepat mungkin.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container grid gap-8 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-16">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Panduan singkat
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Apa yang sebaiknya disertakan
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {contactNotes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">
                  Estimasi respon
                </p>
                <p className="mt-2">
                  1-2 hari kerja untuk pertanyaan umum, lebih cepat untuk kebutuhan prioritas.
                </p>
              </div>

              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">
                  Sumber tambahan
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href="/media-kit"
                    className="inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                  >
                    Media Kit
                  </Link>
                  <Link
                    href="/status"
                    className="inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                  >
                    Status Produk
                  </Link>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
