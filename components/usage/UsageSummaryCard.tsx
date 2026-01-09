"use client";

import { useEffect, useMemo, useState } from "react";

type UsageSummary = {
  cap: number | null;
  used: number;
  remaining: number | null;
  percentUsed: number | null;
  yyyymm: string;
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  canEditCap: boolean;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return numberFormatter.format(value);
}

export default function UsageSummaryCard({
  workspaceId,
  workspaceSlug,
  canEditCap,
}: Props) {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capInput, setCapInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const percentUsed = useMemo(() => {
    if (!summary) return 0;
    if (summary.percentUsed === null || summary.percentUsed === undefined) return 0;
    return Math.min(100, Math.max(0, summary.percentUsed));
  }, [summary]);

  async function fetchSummary() {
    setLoading(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/usage/summary`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "failed_to_load");
      }
      const data = (await res.json()) as UsageSummary;
      setSummary(data);
      setCapInput(
        data.cap === null || data.cap === undefined ? "" : String(data.cap)
      );
    } catch {
      setError("Gagal memuat ringkasan penggunaan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function handleSave() {
    if (!canEditCap) return;
    setSaveError(null);
    setSaveSuccess(null);

    const trimmed = capInput.trim();
    let cap: number | null = null;
    if (trimmed !== "") {
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1_000_000_000) {
        setSaveError("Masukkan angka 0..1.000.000.000 atau kosongkan untuk Unlimited.");
        return;
      }
      cap = parsed;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/usage/cap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cap }),
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 403) {
          setSaveError("Hanya owner/admin yang bisa mengubah batas.");
        } else {
          const data = await res.json().catch(() => null);
          setSaveError(data?.error || "Gagal menyimpan batas.");
        }
        return;
      }

      setSaveSuccess("Batas tersimpan.");
      await fetchSummary();
    } catch {
      setSaveError("Gagal menyimpan batas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-white/60">Usage</p>
          <h2 className="text-xl font-semibold">Ringkasan Pemakaian</h2>
          <p className="text-sm text-white/60">
            Workspace: {workspaceSlug} • Bulan {summary?.yyyymm ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-300">
          {error}{" "}
          <button
            onClick={fetchSummary}
            className="underline decoration-dashed decoration-white/40"
          >
            Coba lagi
          </button>
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-white/60">Cap</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.cap === null ? "Unlimited" : formatNumber(summary?.cap)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-white/60">Used (bulan ini)</p>
          <p className="mt-1 text-lg font-semibold">
            {loading ? "Loading..." : formatNumber(summary?.used)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-white/60">Remaining</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.cap === null
              ? "Unlimited"
              : formatNumber(summary?.remaining)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-white/60">Progress</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.percentUsed !== null && summary?.percentUsed !== undefined
              ? `${Math.round(summary.percentUsed)}%`
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-300"
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {canEditCap ? (
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="text-sm text-white/70">Set Usage Cap (tokens)</label>
            <input
              type="number"
              min={0}
              max={1_000_000_000}
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              placeholder="Kosongkan untuk Unlimited"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-white/50">
              Isi angka untuk batasi token bulanan, kosongkan untuk Unlimited.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-xl border border-emerald-300/30 bg-emerald-500/80 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Cap"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-white/50">
          Hanya owner/admin yang bisa mengubah usage cap. Hubungi admin workspace untuk update.
        </p>
      )}

      {saveError && <p className="mt-3 text-sm text-red-300">{saveError}</p>}
      {saveSuccess && <p className="mt-3 text-sm text-emerald-300">{saveSuccess}</p>}
    </section>
  );
}
