import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";
import { products } from "@/lib/products";
import { roadmap } from "@/lib/roadmap";
import { policies } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Gigaviz Ecosystem Platform",
  description:
    "Satu akun, satu wallet, satu dashboard untuk Create, Automate, Monetize, dan Manage dalam satu ekosistem.",
};

const steps = [
  {
    title: "Create",
    desc: "Bangun konten, template, dan asset yang konsisten untuk brand.",
  },
  {
    title: "Automate",
    desc: "Otomasi workflow operasional dan pesan yang terukur.",
  },
  {
    title: "Monetize",
    desc: "Tarik pembayaran, kelola invoice, dan subscription billing.",
  },
  {
    title: "Manage",
    desc: "Pantau performa, role, dan audit untuk skalabilitas tim.",
  },
];

const roadmapPreview = {
  now: roadmap.now.slice(0, 4),
  next: roadmap.next.slice(0, 3),
  later: roadmap.later.slice(0, 3),
};

export default function HomePage() {
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

          <div className="container relative z-10 grid gap-10 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                Gigaviz Ecosystem Platform
              </div>

              <div className="space-y-4">
                <h1 className="text-balance text-4xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-5xl">
                  Gigaviz Ecosystem Platform
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Satu akun, satu wallet, satu dashboard - Create -&gt; Automate -&gt; Monetize -&gt; Manage.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Get Started
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] bg-transparent px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Explore Products
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Single sign-on
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  WhatsApp Cloud API
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  AI dan automasi
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Billing dan pembayaran
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-full rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                      Ringkasan Ekosistem
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-[color:var(--gv-text)]">
                      Modul utama yang terhubung
                    </h2>
                    <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                      Semua modul berjalan dalam satu ekosistem yang saling terhubung.
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card)] px-3 py-1 text-[11px] text-[color:var(--gv-muted)]">
                    v1 Preview
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  {products.slice(0, 4).map((product) => (
                    <div
                      key={product.slug}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
                          <MarketingIcon
                            name={product.icon}
                            className="h-5 w-5 text-[color:var(--gv-accent)]"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                            {product.name}
                          </div>
                          <div className="text-xs text-[color:var(--gv-muted)]">
                            {product.short}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={product.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-14 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Yang Anda Dapatkan
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Modul yang siap dipakai sejak hari pertama
                </h2>
              </div>
              <Link
                href="/products"
                className="text-sm font-semibold text-[color:var(--gv-accent)] hover:underline"
              >
                Lihat semua modul
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.slug}
                  href={`/products/${product.slug}`}
                  className="group flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 transition hover:-translate-y-1 hover:border-[color:var(--gv-accent)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
                      <MarketingIcon
                        name={product.icon}
                        className="h-6 w-6 text-[color:var(--gv-accent)]"
                      />
                    </div>
                    <StatusBadge status={product.status} />
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[color:var(--gv-muted)]">
                      {product.short}
                    </p>
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gv-accent)]">
                    Lihat detail
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-14 md:py-20">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Cara Kerja
              </p>
              <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Alur sederhana untuk tim modern
              </h2>
              <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
                Ekosistem Gigaviz dibuat agar tim bisa fokus pada hasil, bukan berganti alat.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] text-sm font-semibold text-[color:var(--gv-accent)]">
                      {index + 1}
                    </div>
                    <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-14 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Roadmap
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Arah pengembangan Gigaviz
                </h2>
              </div>
              <Link
                href="/roadmap"
                className="text-sm font-semibold text-[color:var(--gv-accent)] hover:underline"
              >
                Lihat roadmap lengkap
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {(
                [
                  { title: "Now", items: roadmapPreview.now },
                  { title: "Next", items: roadmapPreview.next },
                  { title: "Later", items: roadmapPreview.later },
                ] as const
              ).map((column) => (
                <div
                  key={column.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                    {column.title}
                  </div>
                  <div className="mt-4 space-y-3">
                    {column.items.map((item) => (
                      <div key={item.title} className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] p-4">
                        <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                          {item.title}
                        </div>
                        <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-14 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Aturan dan Kebijakan
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Aturan yang menjaga ekosistem tetap aman
                </h2>
              </div>
              <Link
                href="/policies"
                className="text-sm font-semibold text-[color:var(--gv-accent)] hover:underline"
              >
                Lihat semua kebijakan
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {policies.map((policy) => (
                <Link
                  key={policy.slug}
                  href={`/policies/${policy.slug}`}
                  className="flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 transition hover:-translate-y-1 hover:border-[color:var(--gv-accent)]"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                      {policy.title}
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                      {policy.description}
                    </p>
                  </div>
                  <span className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gv-accent)]">
                    Baca detail
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-14 md:py-20">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[linear-gradient(120deg,_rgba(214,178,94,0.12),_rgba(226,75,168,0.08))] p-8 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Mulai sekarang
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Paket langganan untuk akses fitur, token usage untuk AI generation.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Mulai langganan
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Hubungi sales
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
