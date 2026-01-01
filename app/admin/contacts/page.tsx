"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Contact = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  last_seen_at: string | null;
};

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/contacts", { cache: "no-store" });
        const js = await res.json();
        if (!res.ok) throw new Error(js?.error || "Gagal load contacts");
        if (!dead) setItems(js.items || []);
      } catch (e: any) {
        if (!dead) setError(e.message || "Error");
      } finally {
        if (!dead) setLoading(false);
      }
    }
    run();
    return () => {
      dead = true;
    };
  }, []);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((c) => {
      const hay = `${c.name} ${c.phone} ${(c.tags || []).join(" ")}`.toLowerCase();
      return !qq || hay.includes(qq);
    });
  }, [q, items]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Contacts</div>
          <div className="text-sm text-slate-400">CRM mini — data dari Supabase</div>
        </div>
        <Link
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
          href="/admin/inbox"
        >
          ← Inbox
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
        <div className="border-b border-slate-800 p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama/nomor/tag…"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-700"
          />
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="p-3">Nama</th>
                <th className="p-3">Nomor</th>
                <th className="p-3">Tags</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((c) => (
                  <tr key={c.id} className="border-b border-slate-900 hover:bg-slate-900/30">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-slate-300">{c.phone}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags || []).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-1 rounded-full border border-slate-800 text-slate-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={3}>
                    Tidak ada hasil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 text-xs text-slate-500">
          Next: custom fields, dedup & merge, blacklist/whitelist.
        </div>
      </div>
    </div>
  );
}
