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
  "Broadcast & Notifikasi",
  "Campaign & Segmentasi",
  "Inbox CS Multi-Agent",
  "Chatbot Otomatis",
  "Template Pesan Resmi",
  "Analitik & Laporan",
  "Integrasi Website / CRM",
  "Lainnya",
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
    website: "", // honeypot (harus kosong)
  });

  const phoneDigits = useMemo(() => onlyDigits(form.phone), [form.phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);
    setDeduped(false);

    if (!form.name?.trim()) return setErr("Nama wajib diisi.");
    if (phoneDigits.length < 9 || phoneDigits.length > 15)
      return setErr("Nomor WhatsApp tidak valid. Gunakan 62xxxx atau 08xxxx.");
    if (!form.need) return setErr("Pilih kebutuhan.");

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Server akan normalisasi (0 -> 62). Kita kirim digits saja biar rapi.
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
        throw new Error(data?.message || "Gagal mengirim. Coba lagi beberapa saat.");
      }

      const isDup = !!data?.deduped;
      setDeduped(isDup);

      setOk(
        isDup
          ? "Permintaan Anda sudah kami terima sebelumnya. Tim kami akan tetap menindaklanjuti."
          : "Terima kasih! Permintaan demo Anda sudah kami terima. Tim kami akan menghubungi Anda."
      );

      setForm({
        name: "",
        phone: "",
        business: "",
        need: form.need, // biar pilihan kebutuhan tetap
        notes: "",
        website: "",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi error.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-cyan-200">Form Demo</div>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">
            Request Demo WA Platform
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            Isi data singkat. Kami kirim alur demo dan rekomendasi implementasi sesuai kebutuhan.
          </p>
        </div>
        <span className="hidden rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 ring-1 ring-cyan-400/20 md:inline-flex">
          Cloud API (resmi)
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
            <label className="text-xs text-slate-400">Nama *</label>
            <input
              className={fieldClass}
              placeholder="Nama Anda"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Nomor WhatsApp *</label>
            <input
              className={fieldClass}
              placeholder="62xxxxxxxxxx / 08xxxxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              inputMode="tel"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Format bebas (+62/62/08…) — sistem menormalkan otomatis.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Nama Bisnis (opsional)</label>
            <input
              className={fieldClass}
              placeholder="Nama usaha / brand"
              value={form.business || ""}
              onChange={(e) => setForm((s) => ({ ...s, business: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Kebutuhan *</label>
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
          <label className="text-xs text-slate-400">Catatan (opsional)</label>
          <textarea
            className={fieldClass + " min-h-[110px] resize-y"}
            placeholder="Contoh: ingin kirim 500/hari, data dari Google Sheets, butuh log sukses/gagal, dsb."
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
          {loading ? "Mengirim..." : "Request Demo"}
        </button>

        <p className="text-xs text-slate-500">
          Dengan mengirim form ini, Anda menyatakan bahwa daftar kontak berasal dari <b>opt-in</b> dan kampanye mengikuti prinsip <b>STOP/opt-out</b> serta <b>batas pengiriman aman</b>.
        </p>

        {deduped ? (
          <p className="text-[11px] text-slate-500">
            Info: sistem mendeteksi request serupa sebelumnya (anti-spam). Tim tetap akan menindaklanjuti.
          </p>
        ) : null}
      </form>
    </div>
  );
}
