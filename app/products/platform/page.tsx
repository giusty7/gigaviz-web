import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";

export const metadata: Metadata = {
  title: "Gigaviz Platform (Core OS)",
  description:
    "Fondasi ekosistem Gigaviz untuk akun, workspace, billing, role, dan audit. Indonesia-first, siap untuk scale global.",
  openGraph: {
    title: "Gigaviz Platform (Core OS)",
    description:
      "Fondasi ekosistem Gigaviz untuk akun, workspace, billing, role, dan audit. Indonesia-first, siap untuk scale global.",
    url: "/products/platform",
  },
};

const coreHighlights = [
  {
    title: "Identitas tunggal",
    desc: "Satu akun untuk mengakses semua modul tanpa pindah-pindah login.",
  },
  {
    title: "Workspace bersama",
    desc: "Struktur organisasi, project, dan tim yang konsisten di seluruh modul.",
  },
  {
    title: "Satu dashboard",
    desc: "Kontrol billing, keamanan, dan aktivitas tim dalam satu tampilan.",
  },
];

const featureCards = [
  {
    title: "Account & SSO",
    desc: "Registrasi pengguna, manajemen identitas, dan single sign-on untuk alur login yang aman.",
  },
  {
    title: "Workspace",
    desc: "Kelola organisasi, project, dan struktur tim lintas unit agar kolaborasi terarah.",
  },
  {
    title: "Billing",
    desc: "Paket langganan, invoice, dan kontrol biaya per workspace agar pengeluaran jelas.",
  },
  {
    title: "Roles & Permissions",
    desc: "RBAC untuk Owner, Admin, Member, dan Viewer dengan kontrol akses granular.",
  },
  {
    title: "Settings & Audit Log",
    desc: "Preferensi, limit penggunaan, dan jejak aktivitas untuk kebutuhan keamanan.",
  },
];

const rbacRoles = [
  {
    role: "Owner",
    access: "Mengelola organisasi, billing, dan kebijakan keamanan.",
  },
  {
    role: "Admin",
    access: "Mengatur workspace, user, dan integrasi operasional.",
  },
  {
    role: "Member",
    access: "Menjalankan modul sesuai tugas dan membuat data proyek.",
  },
  {
    role: "Viewer",
    access: "Membaca laporan dan audit tanpa akses perubahan.",
  },
];

const auditEvents = [
  "Login berhasil atau gagal",
  "Workspace dibuat, diarsipkan, atau dipulihkan",
  "Undangan user baru dikirim",
  "Perubahan role dan permission",
  "Paket langganan diubah",
  "Invoice dibuat atau dibayar",
  "Perubahan limit token per workspace",
  "API key dibuat atau dicabut",
];

const securityPosture = [
  {
    title: "Least privilege + RLS",
    desc: "Akses data mengikuti role dan workspace, default paling rendah.",
  },
  {
    title: "Kemudahan audit",
    desc: "Setiap aktivitas penting terekam untuk review dan kepatuhan.",
  },
  {
    title: "Pemisahan data",
    desc: "Data terpisah per workspace untuk mencegah lintas akses.",
  },
];

const modules = [
  "Meta Hub",
  "Helper",
  "Office",
  "Studio",
  "Apps",
  "Pay",
  "Graph",
  "Tracks",
  "Community",
];

export default function PlatformProductPage() {
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

          <div className="container relative z-10 grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                Core OS Gigaviz
              </div>
              <div className="space-y-4">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  Gigaviz Platform (Core OS)
                </h1>
                <p className="text-pretty text-sm text-[color:var(--gv-muted)] md:text-base">
                  Fondasi identitas, workspace, dan billing untuk seluruh ekosistem. Indonesia-first, siap untuk
                  skala global.
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
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] bg-transparent px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Pricing
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Single sign-on
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Multi-workspace
                </span>
                <span className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1">
                  Billing terpusat
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                    Ringkasan Core OS
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-[color:var(--gv-text)]">
                    Semua pondasi dalam satu modul
                  </h2>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    Gigaviz Platform menjadi sumber identitas, workspace, dan billing untuk seluruh modul.
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
                  <MarketingIcon
                    name="platform"
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-[color:var(--gv-muted)]">
                {featureCards.map((feature) => (
                  <li key={feature.title} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{feature.title}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-xs text-[color:var(--gv-muted)]">
                Core OS berjalan sebelum modul lain aktif, sehingga onboarding tim lebih konsisten.
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Apa yang dilakukan Core OS
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Identitas tunggal, workspace bersama, satu dashboard.
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Core OS menyatukan data tim, struktur organisasi, dan kontrol akses agar setiap modul berjalan di
                fondasi yang sama.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {coreHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Fitur utama
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Modul inti yang menjaga ekosistem tetap rapi
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Tabel RBAC
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Peran yang jelas, akses yang aman
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Role-based access control memastikan setiap anggota tim hanya mengakses fitur yang dibutuhkan.
                </p>
              </div>
              <div className="overflow-hidden rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[color:var(--gv-muted)]">
                    <thead className="bg-[color:var(--gv-surface)] text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                      <tr>
                        <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                          Role
                        </th>
                        <th scope="col" className="px-5 py-4 text-[color:var(--gv-text)]">
                          Contoh permission
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rbacRoles.map((item) => (
                        <tr key={item.role} className="border-t border-[color:var(--gv-border)]">
                          <td className="px-5 py-4 font-semibold text-[color:var(--gv-text)]">
                            {item.role}
                          </td>
                          <td className="px-5 py-4">{item.access}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Contoh audit log
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Aktivitas penting selalu tercatat
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Audit log membantu tim memantau perubahan penting dan menjaga akuntabilitas.
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <ul className="space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {auditEvents.map((event) => (
                    <li key={event} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                      <span>{event}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Postur keamanan
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Keamanan yang siap diaudit
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {securityPosture.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-[color:var(--gv-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-center">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Terhubung dengan modul lain
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Pondasi untuk seluruh modul Gigaviz
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Core OS menjadi penghubung akun, workspace, dan billing untuk modul lain di ekosistem.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {modules.map((module) => (
                  <span
                    key={module}
                    className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--gv-text)]"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Siap menyatukan ekosistem Anda?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai dengan Core OS untuk memastikan semua modul berjalan di fondasi yang sama.
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
