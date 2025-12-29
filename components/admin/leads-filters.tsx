"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  needs: string[];
  sources: string[];
  tab: "leads" | "attempts";
};

export function LeadsFilters({ needs, sources, tab }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const q = sp.get("q") || "";
  const need = sp.get("need") || "";
  const source = sp.get("source") || "";
  const status = sp.get("status") || "";

  const exportHref = useMemo(() => {
    const p = new URLSearchParams(sp.toString());
    p.set("tab", tab);
    // page ga usah ikut buat export
    p.delete("page");
    return `/api/admin/leads/export?${p.toString()}`;
  }, [sp, tab]);

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(sp.toString());
    if (!val) p.delete(key);
    else p.set(key, val);
    p.set("tab", tab);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  }

  function apply() {
    // sudah auto lewat setParam, jadi tombol ini cuma feel "apply" bae
    const p = new URLSearchParams(sp.toString());
    p.set("tab", tab);
    router.push(`${pathname}?${p.toString()}`);
  }

  function reset() {
    const p = new URLSearchParams();
    p.set("tab", tab);
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="grid gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <label className="text-xs text-white/70">Cari (nama / WA / bisnis / catatan)</label>
          <input
            defaultValue={q}
            onChange={(e) => setParam("q", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-cyan-500/30"
            placeholder="contoh: 62812 / tokozinta / chatbot"
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-xs text-white/70">Filter kebutuhan</label>
          <select
            value={need}
            onChange={(e) => setParam("need", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">Semua kebutuhan</option>
            {needs.map((n) => (
              <option key={n} value={n} className="text-black">
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-white/70">Sumber</label>
          <select
            value={source}
            onChange={(e) => setParam("source", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">Semua sumber</option>
            {sources.map((s) => (
              <option key={s} value={s} className="text-black">
                {s}
              </option>
            ))}
          </select>
        </div>

        {tab === "attempts" && (
          <div className="md:col-span-2">
            <label className="text-xs text-white/70">Status</label>
            <select
              value={status}
              onChange={(e) => setParam("status", e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="">Semua status</option>
              {["inserted", "deduped", "rate_limited", "invalid", "honeypot", "error"].map((s) => (
                <option key={s} value={s} className="text-black">
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="md:col-span-12 flex flex-wrap gap-2 pt-1">
          <button
            onClick={apply}
            className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
          >
            Terapkan
          </button>
          <button
            onClick={reset}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
          >
            Reset
          </button>

          <a
            href={exportHref}
            className="ml-auto rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
          >
            Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}
