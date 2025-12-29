import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CopyButton } from "@/components/admin/copy-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function clamp(s: string, max: number) {
  const t = (s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function safeQuery(s: string) {
  return clamp(s, 80)
    .replace(/[^a-zA-Z0-9@\s+._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildUrl(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const val = String(v).trim();
    if (!val) return;
    sp.set(k, val);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  // 🔥 Next 16: searchParams itu Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const q = safeQuery(Array.isArray(sp.q) ? sp.q[0] : sp.q || "");
  const need = clamp(Array.isArray(sp.need) ? sp.need[0] : sp.need || "", 120);
  const source = clamp(Array.isArray(sp.source) ? sp.source[0] : sp.source || "", 60);
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page || "1";
  const page = Math.max(1, parseInt(pageRaw || "1", 10) || 1);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = supabaseAdmin();

  // 🔥 Ambil opsi filter langsung dari data (biar cocok dgn value real di DB)
  const { data: needRows } = await supabase
    .from("leads")
    .select("need")
    .order("need", { ascending: true })
    .limit(500);

  const needOptions = Array.from(
    new Set((needRows || []).map((r: any) => (r?.need || "").trim()).filter(Boolean))
  );

  const { data: sourceRows } = await supabase
    .from("leads")
    .select("source")
    .order("source", { ascending: true })
    .limit(200);

  const sourceOptions = Array.from(
    new Set((sourceRows || []).map((r: any) => (r?.source || "").trim()).filter(Boolean))
  );

  // Query dasar
  let query = supabase
    .from("leads")
    .select("id,name,phone,business,need,notes,source,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (source) query = query.eq("source", source);
  if (need) query = query.eq("need", need);

  if (q) {
    const like = `%${q}%`;
    query = query.or(
      [
        `name.ilike.${like}`,
        `phone.ilike.${like}`,
        `business.ilike.${like}`,
        `need.ilike.${like}`,
        `notes.ilike.${like}`,
        `source.ilike.${like}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseParams = { q: q || "", need: need || "", source: source || "" };

  return (
    <div className="min-h-screen bg-[#070B18] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-white/70 text-sm">
              Data terbaru dari form /wa-platform (dan sumber lain).
            </p>
          </div>
          <a href="/" className="text-sm text-cyan-300 hover:text-cyan-200 underline">
            Kembali ke Home
          </a>
        </div>

        {/* Toolbar */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <form className="grid gap-3 md:grid-cols-12" method="GET" action="/admin/leads">
            <div className="md:col-span-5">
              <label className="text-xs text-white/60">Cari (nama / WA / bisnis / catatan)</label>
              <input
                name="q"
                defaultValue={q}
                placeholder="contoh: 62812 / tokokita / chatbot"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B1226] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-white/60">Filter kebutuhan</label>
              <select
                name="need"
                defaultValue={need}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B1226] px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                <option value="">Semua kebutuhan</option>
                {needOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-white/60">Sumber</label>
              <select
                name="source"
                defaultValue={source}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B1226] px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                <option value="">Semua sumber</option>
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-end gap-2">
              <button
                type="submit"
                className="w-full rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
              >
                Terapkan
              </button>
              <Link
                href="/admin/leads"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Reset
              </Link>
            </div>

            <input type="hidden" name="page" value="1" />
          </form>

          <div className="mt-3 text-xs text-white/50">
            Menampilkan {data?.length || 0} dari total {total} data. (Halaman {page} / {totalPages})
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {error && <div className="p-4 text-red-200 text-sm">Error: {error.message}</div>}

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/70 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left">Waktu</th>
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">WA</th>
                  <th className="px-4 py-3 text-left">Bisnis</th>
                  <th className="px-4 py-3 text-left">Kebutuhan</th>
                  <th className="px-4 py-3 text-left">Catatan</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>

              <tbody className="text-white">
                {(data || []).map((r: any) => {
                  const phone = (r.phone || "").toString();
                  const waLink = `https://wa.me/${phone}`;
                  const summary = [
                    "Lead Baru (Gigaviz)",
                    `Nama: ${r.name || "-"}`,
                    `WA: ${phone || "-"}`,
                    `Bisnis: ${r.business || "-"}`,
                    `Kebutuhan: ${r.need || "-"}`,
                    `Catatan: ${r.notes || "-"}`,
                    `Source: ${r.source || "-"}`,
                  ].join("\n");

                  return (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="px-4 py-3">{r.name}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{phone}</span>
                          <div className="flex flex-wrap gap-2">
                            <CopyButton text={phone} label="Copy WA" />
                            <CopyButton text={waLink} label="Copy Link" />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">{r.business || "-"}</td>
                      <td className="px-4 py-3">{r.need}</td>
                      <td className="px-4 py-3 text-white/80">{r.notes || "-"}</td>
                      <td className="px-4 py-3 text-white/70">{r.source || "-"}</td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            className="rounded-xl bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-cyan-300"
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Chat
                          </a>
                          <CopyButton text={summary} label="Copy Ringkas" />
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!error && (!data || data.length === 0) && (
                  <tr>
                    <td className="px-4 py-6 text-white/70" colSpan={8}>
                      Dak ado data untuk filter/search itu, wak.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
            <div>Page size: {PAGE_SIZE}. Total: {total}.</div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/leads${buildUrl({ ...baseParams, page: Math.max(1, page - 1) })}`}
                className={`rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Prev
              </Link>

              <span className="px-2">
                {page} / {totalPages}
              </span>

              <Link
                href={`/admin/leads${buildUrl({ ...baseParams, page: Math.min(totalPages, page + 1) })}`}
                className={`rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 ${
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-white/50">
          Tips: coba cari “gavin” atau filter “Chatbot Otomatis” dari dropdown (itu ngambil value real dari DB).
        </div>
      </div>
    </div>
  );
}
