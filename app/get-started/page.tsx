import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import GetStartedFunnel from "@/components/marketing/get-started-funnel";
import TrackedLink from "@/components/analytics/tracked-link";

export const metadata: Metadata = {
  title: "Mulai dengan Gigaviz",
  description:
    "Pilih cara paling cepat untuk masuk ke ekosistem Gigaviz: Individu atau Tim (Workspace).",
  alternates: {
    canonical: "/get-started",
  },
  openGraph: {
    title: "Mulai dengan Gigaviz",
    description:
      "Pilih cara paling cepat untuk masuk ke ekosistem Gigaviz: Individu atau Tim (Workspace).",
    url: "/get-started",
  },
};

type ComparisonRow = {
  label: string;
  individu: string;
  tim: string;
  planned?: boolean;
};

const comparisonRows: ComparisonRow[] = [
  {
    label: "Account & workspace",
    individu: "1 workspace, 1 user",
    tim: "Multi workspace, multi member",
  },
  {
    label: "Roles & permissions",
    individu: "Akses owner dasar",
    tim: "Owner, Admin, Member, Viewer",
  },
  {
    label: "Billing & invoice",
    individu: "Segera",
    tim: "Segera",
    planned: true,
  },
  {
    label: "Audit log",
    individu: "Segera",
    tim: "Segera",
    planned: true,
  },
  {
    label: "Akses modul",
    individu: "Terbatas sesuai paket",
    tim: "Lebih luas sesuai paket",
  },
  {
    label: "Support",
    individu: "Dokumentasi + komunitas",
    tim: "Prioritas sesuai paket",
  },
];

const trustPoints = [
  "Security-first dengan validasi input dan kontrol akses.",
  "Auditability untuk aktivitas penting di workspace.",
  "Fair use dan anti-abuse untuk menjaga kualitas layanan.",
];

const faqItems = [
  {
    question: "Apakah bisa daftar gratis?",
    answer:
      "Bisa. Akun gratis memiliki akses terbatas (view-only/locked) hingga paket aktif.",
  },
  {
    question: "Apa bedanya Individu vs Tim?",
    answer:
      "Individu untuk solo creator dengan 1 workspace. Tim memberikan multi member, RBAC, dan kontrol lebih lengkap.",
  },
  {
    question: "Biaya token itu apa?",
    answer:
      "Token adalah biaya pemakaian AI/WhatsApp API yang dihitung terpisah dari langganan, berdasarkan penggunaan.",
  },
  {
    question: "Apakah bisa upgrade atau downgrade?",
    answer:
      "Ya, paket dapat disesuaikan kapan saja sesuai kebutuhan tim dan modul yang diaktifkan.",
  },
  {
    question: "Apakah butuh kartu kredit?",
    answer:
      "Tidak selalu. Detail metode pembayaran mengikuti paket dan kebijakan billing yang berlaku.",
  },
  {
    question: "Bagaimana kebijakan penggunaan & keamanan?",
    answer:
      "Gigaviz menerapkan aturan penggunaan, kontrol akses, dan audit untuk menjaga keamanan serta mencegah penyalahgunaan.",
  },
];

export default function GetStartedPage() {
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

          <div className="container relative z-10 grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Get Started
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Mulai dengan Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Pilih cara paling cepat untuk masuk ke ekosistem: Individu atau Tim (Workspace).
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <TrackedLink
                  href="/login?next=/app/onboarding"
                  label="Buat Akun"
                  location="get_started_hero"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Buat Akun
                </TrackedLink>
                <TrackedLink
                  href="/login"
                  label="Masuk"
                  location="get_started_hero"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Masuk
                </TrackedLink>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-sm text-[color:var(--gv-muted)]">
                Fitur tertentu dibuka sesuai paket langganan. Biaya token (AI/WhatsApp API) dihitung terpisah sesuai pemakaian.
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Ringkasan funnel
              </div>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--gv-text)]">
                Masuk ekosistem dalam beberapa langkah
              </h2>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                Pilih paket, selesaikan akun, lalu aktifkan modul sesuai kebutuhan.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-[color:var(--gv-muted)]">
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Pilih Individu atau Tim (Workspace).</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Lengkapi akun dan verifikasi email.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                  <span>Aktifkan modul, billing, dan token sesuai paket.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <GetStartedFunnel />

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Apa yang Anda dapatkan
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Perbandingan fitur inti
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Modul dan akses disesuaikan dengan paket yang Anda pilih.
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[color:var(--gv-muted)]">
                  <thead className="bg-[color:var(--gv-surface)] text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                    <tr>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        Fitur
                      </th>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        Individu
                      </th>
                      <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                        Tim (Workspace)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.label} className="border-t border-[color:var(--gv-border)]">
                        <td className="px-5 py-4 font-semibold text-[color:var(--gv-text)]">
                          {row.label}
                        </td>
                        <td className="px-5 py-4">
                          {row.planned ? (
                            <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                              Segera
                            </span>
                          ) : (
                            row.individu
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {row.planned ? (
                            <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                              Segera
                            </span>
                          ) : (
                            row.tim
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Trust & safety
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Keamanan tetap jadi prioritas
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Kami menyiapkan fondasi keamanan sejak awal onboarding agar ekosistem tetap aman saat tumbuh.
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-3 text-sm text-[color:var(--gv-muted)]">
                  {trustPoints.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                FAQ
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Pertanyaan yang sering muncul
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {faqItems.map((item) => (
                <div
                  key={item.question}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Siap mulai sekarang?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Buat akun untuk memilih paket, lalu lihat detail pricing jika dibutuhkan.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <TrackedLink
                  href="/login?next=/app/onboarding"
                  label="Buat Akun"
                  location="get_started_footer"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Buat Akun
                </TrackedLink>
                <TrackedLink
                  href="/pricing"
                  label="Lihat Pricing"
                  location="get_started_footer"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Pricing
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
