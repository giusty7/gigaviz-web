import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import GetStartedForm from "@/components/marketing/get-started-form";
import GetStartedAuth from "@/components/marketing/get-started-auth";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Mulai onboarding Gigaviz dengan sesi kickoff, setup workspace, dan rekomendasi modul yang presisi.",
};

const onboardingSteps = [
  {
    title: "Kickoff 30 menit",
    desc: "Susun tujuan utama, volume use-case, dan modul prioritas untuk tim Anda.",
    timing: "Hari 1",
  },
  {
    title: "Setup workspace",
    desc: "Konfigurasi role, workflow awal, serta modul yang disepakati.",
    timing: "Hari 1-2",
  },
  {
    title: "Go-live terkendali",
    desc: "Uji coba terbatas, training singkat, dan checklist operasional.",
    timing: "Hari 3",
  },
];

const kickoffBenefits = [
  {
    title: "Peta modul prioritas",
    desc: "Rekomendasi modul berdasarkan alur kerja harian Anda.",
  },
  {
    title: "Template operasional awal",
    desc: "Checklist proses, SLA, dan pengaturan KPI yang siap dipakai.",
  },
  {
    title: "Pilot scope aman",
    desc: "Rencana go-live bertahap dengan risiko terukur.",
  },
];

export default function GetStartedPage() {
  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Get Started
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Mulai onboarding Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Isi data singkat, pilih paket, dan tim kami akan menghubungi Anda untuk setup awal.
              </p>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">Catatan</p>
                <ul className="mt-3 space-y-2">
                  <li>- Onboarding dilakukan dalam 1 sampai 2 hari kerja.</li>
                  <li>- Paket dan modul dapat disesuaikan setelah konsultasi.</li>
                  <li>- Token usage untuk AI dihitung berdasarkan penggunaan.</li>
                </ul>
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex text-sm font-semibold text-[color:var(--gv-accent)] hover:underline"
                >
                  Lihat detail pricing
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <GetStartedAuth />
              <GetStartedForm />
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Alur onboarding
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  Jalur cepat, tetap terukur
                </h2>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                  Kami fokus pada konfigurasi inti, lalu mengaktifkan modul tambahan secara bertahap agar tim cepat produktif.
                </p>
                <div className="mt-6 space-y-3">
                  {onboardingSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 grid h-8 w-8 place-items-center rounded-2xl bg-[color:var(--gv-accent-soft)] text-xs font-semibold text-[color:var(--gv-accent)]">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-[color:var(--gv-text)]">
                              {step.title}
                            </h3>
                            <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-0.5 text-[11px] text-[color:var(--gv-muted)]">
                              {step.timing}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Hasil kickoff
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
                  Yang Anda terima di minggu pertama
                </h3>
                <div className="mt-4 space-y-3">
                  {kickoffBenefits.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-4"
                    >
                      <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                        {item.title}
                      </div>
                      <p className="mt-1 text-sm text-[color:var(--gv-muted)]">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-[color:var(--gv-accent-2)] bg-[color:var(--gv-magenta-soft)] p-4 text-sm text-[color:var(--gv-text)]">
                  Tim Anda akan mendapat ringkasan rekomendasi modul serta prioritas aktivasi dalam format yang mudah dipresentasikan.
                </div>
              </div>
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
                  Bandingkan paket dulu atau langsung jadwalkan onboarding bersama tim kami.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Paket
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Jadwalkan Call
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
