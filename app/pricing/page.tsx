import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Paket langganan Gigaviz dengan modul fleksibel, onboarding terarah, dan transparansi penggunaan token.",
};

const plans = [
  {
    name: "Starter",
    price: "Rp 299.000",
    note: "Mulai dari",
    desc: "Untuk tim kecil yang butuh modul inti dan workflow dasar.",
    features: [
      "Akses ke Core OS dan Workspace",
      "2 modul aktif",
      "1 workspace",
      "Dukungan email dasar",
    ],
  },
  {
    name: "Pro",
    price: "Rp 799.000",
    note: "Mulai dari",
    desc: "Untuk tim operasional yang butuh automasi dan inbox.",
    features: [
      "Semua fitur Starter",
      "5 modul aktif",
      "Scheduler kampanye",
      "Support prioritas",
    ],
    highlight: "Paling dipilih",
  },
  {
    name: "Business",
    price: "Rp 1.900.000",
    note: "Mulai dari",
    desc: "Untuk tim yang butuh multi workspace dan integrasi lanjutan.",
    features: [
      "Semua fitur Pro",
      "10 modul aktif",
      "Multi workspace",
      "Role dan audit tingkat lanjut",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "Hubungi tim",
    desc: "Untuk kebutuhan enterprise, SLA, dan integrasi khusus.",
    features: [
      "Semua fitur Business",
      "SLA dan onboarding khusus",
      "Integrasi custom",
      "Account manager dedicated",
    ],
  },
];

const platformIncludes = [
  "Single sign-on dan manajemen role",
  "Template workflow operasional utama",
  "Onboarding dan training singkat untuk tim inti",
  "Audit trail untuk aktivitas penting",
  "Roadmap produk yang sinkron dengan kebutuhan tim",
];

const assuranceItems = [
  {
    title: "Setup berlapis",
    desc: "Rencana implementasi bertahap agar tim siap tanpa overload.",
  },
  {
    title: "Kontrol anggaran",
    desc: "Limit usage per workspace + laporan penggunaan berkala.",
  },
  {
    title: "Dukungan prioritas",
    desc: "SLA khusus untuk paket Business dan Enterprise.",
  },
];

export default function PricingPage() {
  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Harga
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Paket langganan untuk seluruh ekosistem
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Harga di bawah ini adalah starting price dan dapat disesuaikan dengan kebutuhan modul serta volume penggunaan.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className="flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                        {plan.name}
                      </h2>
                      {plan.highlight ? (
                        <span className="rounded-full border border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gv-accent)]">
                          {plan.highlight}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                      {plan.note}
                    </p>
                    <div className="mt-2 text-2xl font-semibold text-[color:var(--gv-text)]">
                      {plan.price}
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                      {plan.desc}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="/get-started"
                    className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Selalu termasuk
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Fondasi ekosistem Gigaviz
                </h2>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                  Setiap paket sudah mencakup modul inti dan setup awal agar tim Anda bisa langsung beroperasi.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {platformIncludes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                {assuranceItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5"
                  >
                    <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                      {item.desc}
                    </p>
                  </div>
                ))}
                <div className="rounded-3xl border border-[color:var(--gv-accent-2)] bg-[color:var(--gv-magenta-soft)] p-5 text-sm text-[color:var(--gv-text)]">
                  Paket Business & Enterprise mendapat review roadmap dan penyesuaian modul setiap kuartal.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Penggunaan token
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Biaya AI generation berbasis token
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Token digunakan untuk fitur AI seperti copy generator, summarizer, dan studio kreatif. Harga token dapat berubah sesuai biaya model dan penggunaan.
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">Catatan penggunaan</p>
                <ul className="mt-3 space-y-2">
                  <li>- Token dihitung per output atau permintaan.</li>
                  <li>- Harga token akan ditampilkan sebelum penggunaan masif.</li>
                  <li>- Anda dapat menetapkan limit token per workspace.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Ingin paket khusus?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Hubungi tim kami untuk paket enterprise, SLA, dan integrasi custom.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Start subscription
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Talk to sales
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
