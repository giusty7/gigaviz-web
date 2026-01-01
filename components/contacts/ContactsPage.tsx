"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { fmtTime } from "@/lib/inbox/utils";

type Props = { workspaceId: string };

type ContactRow = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  lastSeenAt?: string | null;
  createdAt?: string | null;
};

export default function ContactsPage({ workspaceId }: Props) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY");
    return createBrowserClient(url, anon);
  }, []);

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErrMsg(null);

    const { data, error } = await supabase
      .from("contacts")
      .select("id, name, phone, tags, last_seen_at, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      setErrMsg(error.message);
      setLoading(false);
      return;
    }

    const mapped: ContactRow[] = (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name ?? "Unknown",
      phone: c.phone ?? "",
      tags: Array.isArray(c.tags) ? c.tags : [],
      lastSeenAt: c.last_seen_at ?? null,
      createdAt: c.created_at ?? null,
    }));

    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((c) => {
      const hay = `${c.name} ${c.phone} ${(c.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [q, rows]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Contacts</div>
          <div className="text-sm text-slate-400">CRM mini (Supabase)</div>
          {errMsg && <div className="mt-2 text-xs text-red-300">Error: {errMsg}</div>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
          >
            Refresh
          </button>
          <Link
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            href="/admin/inbox"
          >
            ← Inbox
          </Link>
        </div>
      </div>

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
                <th className="p-3">Last seen</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : (
                <>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-900 hover:bg-slate-900/30"
                    >
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-slate-300">{c.phone}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(c.tags ?? []).map((t) => (
                            <span
                              key={t}
                              className="text-[11px] px-2 py-1 rounded-full border border-slate-800 text-slate-300"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-slate-400">
                        {c.lastSeenAt ? fmtTime(c.lastSeenAt) : "-"}
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td className="p-6 text-slate-400" colSpan={4}>
                        Dak ado hasil.
                      </td>
                    </tr>
                  )}
                </>
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
