"use client";

import { useEffect, useMemo, useState } from "react";

type MetaEventRow = {
  id: string;
  event_name: string;
  phone_e164: string | null;
  status: string;
  error: string | null;
  created_at: string;
  source: string;
};

const EVENT_OPTIONS = ["Lead", "Purchase", "AddToCart", "QualifiedProspect"] as const;

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID");
}

export default function MetaEventsPage() {
  const [items, setItems] = useState<MetaEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [eventName, setEventName] = useState<(typeof EVENT_OPTIONS)[number]>("Lead");
  const [sendingEnabled, setSendingEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/meta/events?limit=50", { cache: "no-store" });
      const js = (await res.json().catch(() => ({}))) as {
        items?: MetaEventRow[];
        error?: string;
        sendingEnabled?: boolean;
      };
      if (!res.ok) {
        throw new Error(js.error || "Gagal load events");
      }
      setItems(js.items ?? []);
      setSendingEnabled(Boolean(js.sendingEnabled));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function recordEvent(name: (typeof EVENT_OPTIONS)[number]) {
    setSubmitting(true);
    setError(null);
    setResultMsg(null);
    try {
      const res = await fetch("/api/admin/meta/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: name,
          phoneE164: phone,
          source: "admin",
        }),
      });
      const js = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(js.error || "Gagal record event");
      }
      const msg = js.status ? `Status: ${js.status}` : "Recorded";
      setResultMsg(msg);
      await loadEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const recent = useMemo(() => items, [items]);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <div className="mb-4">
        <div className="text-xl font-semibold">Meta Events</div>
        <div className="text-sm text-slate-400">
          Events are recorded for measurement/reporting. Sending to Meta is disabled by default
          (dry-run).
        </div>
        {sendingEnabled && (
          <div className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            Sending enabled
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {resultMsg && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {resultMsg}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="text-sm font-semibold">Record Test Event</div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (E.164)"
            className="min-w-[220px] flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
          />
          <select
            value={eventName}
            onChange={(e) => setEventName(e.target.value as (typeof EVENT_OPTIONS)[number])}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
          >
            {EVENT_OPTIONS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <button
            onClick={() => recordEvent(eventName)}
            disabled={submitting}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Recording..." : "Record"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40">
        <div className="border-b border-slate-800 p-3 text-sm font-semibold">Recent Events</div>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="p-3">Time</th>
                <th className="p-3">Event</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Status</th>
                <th className="p-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="p-4 text-slate-400" colSpan={5}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading &&
                recent.map((row) => (
                  <tr key={row.id} className="border-b border-slate-900/40">
                    <td className="p-3 text-xs text-slate-300">{fmtTime(row.created_at)}</td>
                    <td className="p-3">{row.event_name}</td>
                    <td className="p-3">{row.phone_e164 || "-"}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3 text-xs text-rose-300">{row.error || "-"}</td>
                  </tr>
                ))}
              {!loading && recent.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-400" colSpan={5}>
                    No events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
