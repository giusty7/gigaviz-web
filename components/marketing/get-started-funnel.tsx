"use client";

import { useState } from "react";

type PlanKey = "individu" | "tim";

const plans = [
  {
    key: "individu",
    title: "Individu",
    desc: "Untuk kreator solo atau operator yang butuh workflow rapi.",
    highlights: ["1 workspace", "1 user", "Akses dasar untuk modul inti"],
    cta: "Pilih Individu",
    note: "Cocok untuk memulai dengan kebutuhan sederhana.",
  },
  {
    key: "tim",
    title: "Tim (Workspace)",
    desc: "Untuk tim yang butuh kolaborasi, role, dan kontrol.",
    highlights: ["Multi member", "Roles & permissions (RBAC)", "Audit log"],
    cta: "Pilih Tim",
    note: "Dirancang untuk kolaborasi dan kontrol akses.",
  },
] as const;

const steps = [
  "Buat akun",
  "Verifikasi email",
  "Masuk beranda",
  "Buat workspace (opsional untuk Tim)",
  "Aktifkan modul sesuai paket",
];

export default function GetStartedFunnel() {
  const [selected, setSelected] = useState<PlanKey>("individu");
  const activePlan = plans.find((plan) => plan.key === selected) ?? plans[0];

  const handleSelect = (key: PlanKey) => {
    setSelected(key);
  };

  return (
    <>
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
        <div className="container py-12 md:py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Pilih paket awal
              </p>
              <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Mulai sebagai individu atau tim
              </h2>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                Paket menentukan akses modul, jumlah anggota, dan kontrol workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-2 text-xs text-[color:var(--gv-muted)]">
              Bisa upgrade atau downgrade kapan saja.
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const isActive = plan.key === selected;
              return (
                <div
                  key={plan.key}
                  className={
                    isActive
                      ? "rounded-3xl border border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] p-6 text-[color:var(--gv-text)]"
                      : "rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-[color:var(--gv-text)]"
                  }
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{plan.title}</h3>
                    {isActive ? (
                      <span className="rounded-full border border-[color:var(--gv-accent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-accent)]">
                        Terpilih
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                    {plan.desc}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                    {plan.highlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#steps"
                    onClick={() => handleSelect(plan.key)}
                    className={
                      isActive
                        ? "mt-6 w-full rounded-2xl bg-[color:var(--gv-accent)] px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                        : "mt-6 w-full rounded-2xl border border-[color:var(--gv-border)] px-4 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                    }
                  >
                    {plan.cta}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="steps" className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
        <div className="container py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Apa yang Anda lakukan selanjutnya
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                Langkah singkat, hasil yang jelas
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Fokus pada langkah inti agar akses modul aktif lebih cepat.
              </p>
              <div className="mt-4 rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3 text-xs text-[color:var(--gv-muted)]">
                <span className="rounded-full border border-[color:var(--gv-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-accent)]">
                  Akses terbatas
                </span>
                <span className="ml-2">
                  Akun gratis: akses modul dibatasi (view-only/locked) sampai paket aktif.
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Pilihan Anda
              </div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
                {activePlan.title}
              </div>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                {activePlan.note}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] text-sm font-semibold text-[color:var(--gv-accent)]">
                    {index + 1}
                  </div>
                  <h3 className="text-base font-semibold text-[color:var(--gv-text)]">
                    {step}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
