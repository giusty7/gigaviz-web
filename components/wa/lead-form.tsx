"use client";

import { useMemo, useState } from "react";

type LeadPayload = {
  name: string;
  phone: string;
  business?: string;
  need: string;
  notes?: string;
  website?: string; // honeypot anti-bot
};

const NEED_OPTIONS = [
  "Broadcast & Notifications",
  "Campaigns & Segmentation",
  "Support Inbox (Multi-agent)",
  "Automated Chatbot",
  "Official Message Templates",
  "Analytics & Reporting",
  "Website / CRM Integration",
  "Other",
];

function onlyDigits(input: string) {
  return (input || "").replace(/\D+/g, "");
}

// Biar class input konsisten & gampang dirawat
const fieldClass =
  "mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none " +
  "focus:ring-2 focus:ring-cyan-500/40 " +
  "bg-white/5 border-white/10 " +
  "text-slate-200 placeholder:text-slate-500";

export default function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deduped, setDeduped] = useState(false);

  const [form, setForm] = useState<LeadPayload>({
    name: "",
    phone: "",
    business: "",
    need: NEED_OPTIONS[0],
    notes: "",
    website: "", // honeypot (should stay empty)
  });

  const phoneDigits = useMemo(() => onlyDigits(form.phone), [form.phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);
    setDeduped(false);

    if (!form.name?.trim()) return setErr("Name is required.");
    if (phoneDigits.length < 9 || phoneDigits.length > 15)
      return setErr("Invalid WhatsApp number. Use 62xxxx or 08xxxx.");
    if (!form.need) return setErr("Select a need.");

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Server normalizes (0 -> 62). Send digits only to stay clean.
        body: JSON.stringify({
          name: form.name,
          phone: phoneDigits,
          business: form.business,
          need: form.need,
          notes: form.notes,
          website: form.website, // honeypot
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        deduped?: boolean;
      };

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to send. Please try again shortly.");
      }

      const isDup = !!data?.deduped;
      setDeduped(isDup);

      setOk(
        isDup
          ? "We already received this request. Our team will still follow up."
          : "Thank you! Your demo request is in. Our team will reach out."
      );

      setForm({
        name: "",
        phone: "",
        business: "",
        need: form.need, // keep the selected need value
        notes: "",
        website: "",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-cyan-200">Demo Form</div>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">
            Request WhatsApp Platform Demo
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            Share a few details. We’ll send a demo flow and implementation recommendations for your needs.
          </p>
        </div>
        <span className="hidden rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 ring-1 ring-cyan-400/20 md:inline-flex">
          Cloud API (official)
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* Honeypot: disembunyikan (kalau terisi, server anggap bot) */}
        <div className="hidden" aria-hidden="true">
          <label className="text-xs text-slate-400">Website</label>
          <input
            className={fieldClass}
            placeholder="leave empty"
            value={form.website || ""}
            onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))}
            autoComplete="off"
            tabIndex={-1}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Name *</label>
            <input
              className={fieldClass}
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">WhatsApp number *</label>
            <input
              className={fieldClass}
              placeholder="62xxxxxxxxxx / 08xxxxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              inputMode="tel"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Any format (+62/62/08…) — the system normalizes automatically.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Business name (optional)</label>
            <input
              className={fieldClass}
              placeholder="Business or brand name"
              value={form.business || ""}
              onChange={(e) => setForm((s) => ({ ...s, business: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Need *</label>
            <select
              className={fieldClass}
              value={form.need}
              onChange={(e) => setForm((s) => ({ ...s, need: e.target.value }))}
            >
              {NEED_OPTIONS.map((n) => (
                <option key={n} value={n} className="bg-slate-950 text-slate-100">
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400">Notes (optional)</label>
          <textarea
            className={fieldClass + " min-h-[110px] resize-y"}
            placeholder="Example: send 500/day, data from Google Sheets, need success/fail logs, etc."
            value={form.notes || ""}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          />
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
            {err}
          </div>
        ) : null}

        {ok ? (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">
            {ok}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Request Demo"}
        </button>

        <p className="text-xs text-slate-500">
          By submitting, you confirm your contact lists are <b>opt-in</b> and campaigns follow <b>STOP/opt-out</b> and <b>safe sending limits</b>.
        </p>

        {deduped ? (
          <p className="text-[11px] text-slate-500">
            Info: we detected a similar request earlier (anti-spam). The team will still follow up.
          </p>
        ) : null}
      </form>
    </div>
  );
}
