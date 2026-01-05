'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TemplateRow = {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  updated_at: string | null;
};

async function readError(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const js = await res.json().catch(() => ({}));
    const msg =
      typeof js?.error === "string"
        ? js.error
        : typeof js?.error?.message === "string"
          ? js.error.message
          : res.statusText;
    return redactMessage(msg || "Request failed");
  }
  const text = await res.text();
  const raw = text || res.statusText || "Request failed";
  if (raw.trim().startsWith("<!DOCTYPE") || raw.trim().startsWith("<html")) {
    return "Request failed";
  }
  return redactMessage(raw);
}

async function readJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error("Unexpected response");
  }
  return (await res.json()) as T;
}

function redactMessage(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  const redacted = cleaned
    .replace(/EA[A-Za-z0-9]{10,}/g, "[redacted-token]")
    .replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]");
  if (redacted.length > 160) return `${redacted.slice(0, 160)}...`;
  return redacted;
}

export default function TemplatesPage() {
  const [items, setItems] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/wa/templates", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const js = await readJson<{ items?: TemplateRow[]; templates?: TemplateRow[] }>(res);
      setItems(js.items || js.templates || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function syncTemplates() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/wa/templates/sync", { method: "POST" });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      await readJson<{ ok?: boolean }>(res);
      await loadTemplates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }

  async function createDraft() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      await readJson<{ template?: TemplateRow }>(res);
      await loadTemplates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  const rows = useMemo(() => items, [items]);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Templates</div>
          <div className="text-xs text-slate-400">WhatsApp template list</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/inbox"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            Back
          </Link>
          <button
            onClick={syncTemplates}
            disabled={syncing}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            {syncing ? "Syncing..." : "Sync from Meta"}
          </button>
          <button
            onClick={createDraft}
            disabled={creating}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            {creating ? "Creating..." : "Create Draft"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-950/40">
        <div className="border-b border-slate-800 p-3 text-xs text-slate-400">
          {loading ? "Loading..." : `${rows.length} templates`}
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Language</th>
                <th className="p-3">Status</th>
                <th className="p-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-900/50">
                  <td className="p-3">{row.name}</td>
                  <td className="p-3">{row.category}</td>
                  <td className="p-3">{row.language}</td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3">{row.updated_at ?? "-"}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={5}>
                    No templates yet.
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
