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
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(9, "Invalid WhatsApp number."),
  company: z.string().optional(),
});

const stepTwoSchema = z.object({
  plan: z.enum(planOptions, { message: "Select a plan first." }),
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
        setError(result.error.issues[0]?.message ?? "Please complete the required fields.");
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      const result = stepTwoSchema.safeParse({ plan: form.plan });
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? "Select a plan.");
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
        throw new Error(data?.message || "Submission failed. Please try again.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
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
            Start Gigaviz onboarding
          </h2>
        </div>
        <div className="text-xs text-[color:var(--gv-muted)]">Step {step} of 3</div>
      </div>

      {success ? (
        <div className="mt-6 rounded-2xl border border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] p-4 text-sm text-[color:var(--gv-text)]">
          Thank you. Our team will contact you with the next steps.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="text-sm text-[color:var(--gv-muted)]">
                Your account will be activated after onboarding. For now we coordinate via
                email and WhatsApp.
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
                <label className="text-xs text-[color:var(--gv-muted)]">Full name *</label>
                <input
                  className={fieldClass}
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Your name"
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
                <label className="text-xs text-[color:var(--gv-muted)]">WhatsApp number *</label>
                <input
                  className={fieldClass}
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="62xxxxxxxxxx or 08xxxxxxxxxx"
                  inputMode="tel"
                />
                <p className="mt-1 text-xs text-[color:var(--gv-muted)]">
                  We use WhatsApp for initial onboarding coordination.
                </p>
              </div>

              <div>
                <label className="text-xs text-[color:var(--gv-muted)]">
                  Business name (optional)
                </label>
                <input
                  className={fieldClass}
                  value={form.company}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, company: event.target.value }))
                  }
                  placeholder="Business or brand name"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="text-sm text-[color:var(--gv-muted)]">
                Pick the plan that best matches your current needs.
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
                        ? "Core module access for small teams."
                        : option === "Pro"
                        ? "Scheduler and automation for operations."
                        : option === "Business"
                        ? "Multi-workspace and advanced audit."
                        : "SLA and custom integrations."}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="text-sm text-[color:var(--gv-muted)]">
                Review your details before submitting.
              </div>
              <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] p-4 text-sm text-[color:var(--gv-muted)]">
                <div className="flex justify-between">
                  <span>Name</span>
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
                  <span>Plan</span>
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
                Back
              </button>
            ) : null}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
