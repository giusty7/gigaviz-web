"use client";

import { useMemo, useState } from "react";

type LeadPayload = {
  name: string;
  phone: string;
  business?: string;
  need: string;
  notes?: string;
};

const NEED_OPTIONS = [
  "Inbox CS Multi-Agent",
  "WA Massal (Broadcast/Campaign)",
  "Chatbot Otomatis",
  "Notifikasi Transaksi/Tagihan",
  "Template Pesan (Utility/Marketing/OTP)",
  "Lainnya",
];

function normalizePhone(input: string) {
  return input.replace(/[^\d]/g, "");
}

// biar class input konsisten & gampang dirawat
const fieldClass =
  "mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none " +
  "focus:ring-2 focus:ring-cyan-500/40 " +
  // background & border biar aman di light/dark
  "bg-white dark:bg-background border-white/15 " +
  // ini inti fix: warna teks & placeholder
  "text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400";

export default function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<LeadPayload>({
    name: "",
    phone: "",
    business: "",
    need: NEED_OPTIONS[0],
    notes: "",
  });

  const phoneNormalized = useMemo(() => normalizePhone(form.phone), [form.phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);

    if (!form.name.trim()) return setErr("Nama wajib diisi.");
    if (phoneNormalized.length < 9) return setErr("Nomor WA kurang valid. Isi minimal 9 digit angka.");
    if (!form.need) return setErr("Pilih kebutuhan.");

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: phoneNormalized }),
      });

      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) throw new Error(data.message || "Gagal mengirim.");

      setOk("Mantap! Data sudah masuk. Tim Gigaviz bakal follow up secepatnya.");
      setForm({ name: "", phone: "", business: "", need: NEED_OPTIONS[0], notes: "" });
    } catch (e: any) {
      setErr(e?.message || "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold">Nama</label>
        <input
          className={fieldClass}
          placeholder="Nama kamu"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Nomor WhatsApp</label>
        <input
          className={fieldClass}
          placeholder="contoh: 08xxxxxxxxxx"
          value={form.phone}
          onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
          inputMode="tel"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Disarankan angka saja. (Kita normalisasi otomatis.)
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold">Nama Bisnis (opsional)</label>
        <input
          className={fieldClass}
          placeholder="Nama usaha / brand"
          value={form.business}
          onChange={(e) => setForm((s) => ({ ...s, business: e.target.value }))}
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Kebutuhan Utama</label>
        <select
          className={fieldClass}
          value={form.need}
          onChange={(e) => setForm((s) => ({ ...s, need: e.target.value }))}
        >
          {NEED_OPTIONS.map((n) => (
            <option key={n} value={n} className="text-black">
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold">Catatan (opsional)</label>
        <textarea
          className={fieldClass + " min-h-[96px] resize-y"}
          placeholder="Ceritakan kebutuhan singkat (mis: mau WA massal 1000/hari + inbox multi-agent)"
          value={form.notes}
          onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
        />
      </div>

      {err ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</p>
      ) : null}

      {ok ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">{ok}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Mengirim..." : "Kirim & Minta Demo"}
      </button>

      <p className="text-xs text-muted-foreground">
        Dengan mengirim, kamu setuju dihubungi via WhatsApp untuk follow up kebutuhan.
      </p>
    </form>
  );
}
