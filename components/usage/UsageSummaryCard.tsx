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
  if (value === null || value === undefined) return "-";
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
      const res = await fetch(`/api/billing/summary?workspaceSlug=${workspaceSlug}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || "failed_to_load");
      }
      const usage = data.summary?.usage as UsageSummary | undefined;
      setSummary(usage ?? null);
      setCapInput(usage?.cap === null || usage?.cap === undefined ? "" : String(usage.cap));
    } catch {
      setError("Failed to load usage summary.");
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
        setSaveError("Enter 0..1,000,000,000 or leave blank for Unlimited.");
        return;
      }
      cap = parsed;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/billing/tokens/cap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSlug, cap }),
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 403) {
          setSaveError("Only workspace owners or admins can change the limit.");
        } else {
          const data = await res.json().catch(() => null);
          setSaveError(data?.error || "Failed to save the limit.");
        }
        return;
      }

      setSaveSuccess("Limit saved.");
      await fetchSummary();
    } catch {
      setSaveError("Failed to save the limit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-foreground shadow-lg shadow-gigaviz-navy/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Usage</p>
          <h2 className="text-xl font-semibold">Usage Summary</h2>
          <p className="text-sm text-muted-foreground">
            Workspace: {workspaceSlug} - Month {summary?.yyyymm ?? "-"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-sm font-semibold text-foreground hover:bg-gigaviz-surface/80 disabled:opacity-60"
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
            className="underline decoration-dashed decoration-foreground/40"
          >
            Coba lagi
          </button>
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-gigaviz-surface p-4">
          <p className="text-xs text-muted-foreground">Cap</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.cap === null ? "Unlimited" : formatNumber(summary?.cap)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-gigaviz-surface p-4">
          <p className="text-xs text-muted-foreground">Used (this month)</p>
          <p className="mt-1 text-lg font-semibold">
            {loading ? "Loading..." : formatNumber(summary?.used)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-gigaviz-surface p-4">
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.cap === null ? "Unlimited" : formatNumber(summary?.remaining)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-gigaviz-surface p-4">
          <p className="text-xs text-muted-foreground">Progress</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.percentUsed !== null && summary?.percentUsed !== undefined
              ? `${Math.round(summary.percentUsed)}%`
              : "-"}
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gigaviz-surface">
        <div
          className="h-full rounded-full bg-gigaviz-gold transition-all duration-300"
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
              placeholder="Leave blank for Unlimited"
              className="mt-2 w-full rounded-xl border border-border bg-gigaviz-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gigaviz-gold focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter a number to cap monthly tokens, or leave blank for Unlimited.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-xl border border-gigaviz-gold/40 bg-gigaviz-gold px-4 text-sm font-semibold text-gigaviz-navy shadow-lg shadow-gigaviz-gold/20 hover:bg-gigaviz-gold/90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Cap"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Only workspace owners or admins can change the usage cap. Contact your workspace admin for updates.
        </p>
      )}

      {saveError && <p className="mt-3 text-sm text-red-300">{saveError}</p>}
      {saveSuccess && <p className="mt-3 text-sm text-gigaviz-gold">{saveSuccess}</p>}
    </section>
  );
}
