"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

const planOptions = ["Starter", "Pro", "Business", "Enterprise"] as const;

type Plan = (typeof planOptions)[number];

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  plan: Plan;
  website: string;
};

const stepOneSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter."),
  email: z.string().email("Email tidak valid."),
  phone: z.string().min(9, "Nomor WhatsApp tidak valid."),
  company: z.string().optional(),
});

const stepTwoSchema = z.object({
  plan: z.enum(planOptions, { message: "Pilih paket terlebih dahulu." }),
});

function onlyDigits(input: string) {
  return (input || "").replace(/\D+/g, "");
}

const fieldClass =
  "mt-1 w-full rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3 text-sm text-[color:var(--gv-text)] placeholder:text-[color:var(--gv-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gv-accent)]";

export default function GetStartedForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
    plan: "Starter",
    website: "",
  });

  const phoneDigits = useMemo(() => onlyDigits(form.phone), [form.phone]);

  async function goNext() {
    setError(null);

    if (step === 1) {
      const result = stepOneSchema.safeParse({
        name: form.name,
        email: form.email,
        phone: phoneDigits,
        company: form.company || undefined,
      });

      if (!result.success) {
        setError(result.error.issues[0]?.message ?? "Data belum lengkap.");
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      const result = stepTwoSchema.safeParse({ plan: form.plan });
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? "Pilih paket.");
        return;
      }

      setStep(3);
    }
  }

  function goBack() {
    setError(null);
    setStep((value) => Math.max(1, value - 1));
  }

  async function onSubmit() {
    setError(null);
    setLoading(true);

    const payload = {
      name: form.name,
      phone: phoneDigits,
      business: form.company || undefined,
      need: `Get Started - ${form.plan}`,
      notes: `Email: ${form.email}`,
      source: "get-started",
      website: form.website,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Gagal mengirim. Coba lagi.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi error.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
            Get Started
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[color:var(--gv-text)]">
            Mulai onboarding Gigaviz
          </h2>
        </div>
        <div className="text-xs text-[color:var(--gv-muted)]">Langkah {step} dari 3</div>
      </div>

      {success ? (
        <div className="mt-6 rounded-2xl border border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] p-4 text-sm text-[color:var(--gv-text)]">
          Terima kasih. Tim kami akan menghubungi Anda untuk langkah berikutnya.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="text-sm text-[color:var(--gv-muted)]">
                Akun akan diaktifkan setelah proses onboarding. Saat ini kami menggunakan email dan WhatsApp untuk koordinasi.
              </div>

              <div className="hidden" aria-hidden="true">
                <label className="text-xs text-[color:var(--gv-muted)]">Website</label>
                <input
                  className={fieldClass}
                  value={form.website}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, website: event.target.value }))
                  }
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="text-xs text-[color:var(--gv-muted)]">Nama lengkap *</label>
                <input
                  className={fieldClass}
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Nama Anda"
                />
              </div>

              <div>
                <label className="text-xs text-[color:var(--gv-muted)]">Email *</label>
                <input
                  className={fieldClass}
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="email@domain.com"
                  type="email"
                />
              </div>

              <div>
                <label className="text-xs text-[color:var(--gv-muted)]">Nomor WhatsApp *</label>
                <input
                  className={fieldClass}
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="62xxxxxxxxxx atau 08xxxxxxxxxx"
                  inputMode="tel"
                />
                <p className="mt-1 text-xs text-[color:var(--gv-muted)]">
                  Kami menggunakan WhatsApp untuk koordinasi onboarding awal.
                </p>
              </div>

              <div>
                <label className="text-xs text-[color:var(--gv-muted)]">
                  Nama bisnis (opsional)
                </label>
                <input
                  className={fieldClass}
                  value={form.company}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, company: event.target.value }))
                  }
                  placeholder="Nama bisnis atau brand"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="text-sm text-[color:var(--gv-muted)]">
                Pilih paket yang paling mendekati kebutuhan Anda saat ini.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {planOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: option }))}
                    className={
                      option === form.plan
                        ? "rounded-2xl border border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] p-4 text-left text-sm text-[color:var(--gv-text)]"
                        : "rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-left text-sm text-[color:var(--gv-muted)]"
                    }
                  >
                    <div className="font-semibold text-[color:var(--gv-text)]">
                      {option}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--gv-muted)]">
                      {option === "Starter"
                        ? "Akses modul inti untuk tim kecil."
                        : option === "Pro"
                        ? "Scheduler dan automasi untuk operasional."
                        : option === "Business"
                        ? "Multi workspace dan audit lanjutan."
                        : "SLA dan integrasi khusus."}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="text-sm text-[color:var(--gv-muted)]">
                Periksa kembali data sebelum mengirim.
              </div>
              <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] p-4 text-sm text-[color:var(--gv-muted)]">
                <div className="flex justify-between">
                  <span>Nama</span>
                  <span className="text-[color:var(--gv-text)]">{form.name}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Email</span>
                  <span className="text-[color:var(--gv-text)]">{form.email}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>WhatsApp</span>
                  <span className="text-[color:var(--gv-text)]">{form.phone}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Paket</span>
                  <span className="text-[color:var(--gv-text)]">{form.plan}</span>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-[color:var(--gv-accent-2)] bg-[color:var(--gv-magenta-soft)] p-3 text-sm text-[color:var(--gv-text)]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)]"
              >
                Kembali
              </button>
            ) : null}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
              >
                Lanjutkan
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)] disabled:opacity-60"
              >
                {loading ? "Mengirim..." : "Kirim"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
