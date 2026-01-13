import { supabaseAdmin } from "@/lib/supabase/admin";
import { LeadsFilters } from "@/components/admin/leads-filters";
import { LeadActions } from "@/components/admin/lead-actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SP = {
  tab?: string;
  q?: string;
  need?: string;
  source?: string;
  status?: string; // attempts
  page?: string;
  pageSize?: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

type LeadRow = {
  id: string;
  created_at: string | null;
  name: string | null;
  phone: string | null;
  business: string | null;
  need: string | null;
  notes: string | null;
  source: string | null;
};

type AttemptRow = {
  id: string;
  created_at: string | null;
  status: string;
  reason: string | null;
  name: string | null;
  phone: string | null;
  business: string | null;
  need: string | null;
  notes: string | null;
  source: string | null;
  ip: string | null;
};

type LeadOptionRow = {
  need: string | null;
  source: string | null;
};

function asString(v: string | string[] | undefined) {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function toInt(v: string, d: number) {
  const n = parseInt(v || "", 10);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function badgeClass(status: string) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold";
  switch (status) {
    case "inserted":
      return `${base} border-emerald-400/20 bg-emerald-400/10 text-emerald-200`;
    case "deduped":
      return `${base} border-amber-400/20 bg-amber-400/10 text-amber-200`;
    case "rate_limited":
      return `${base} border-red-400/20 bg-red-400/10 text-red-200`;
    case "invalid":
      return `${base} border-white/15 bg-white/5 text-white/70`;
    case "honeypot":
      return `${base} border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200`;
    case "error":
      return `${base} border-red-400/20 bg-red-400/10 text-red-200`;
    default:
      return `${base} border-white/15 bg-white/5 text-white/70`;
  }
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams; // biar aman Next versi beda
}) {
  const sp: SP = searchParams;

  const tab = (asString(sp.tab) || "leads") as "leads" | "attempts";
  const q = asString(sp.q).trim();
  const need = asString(sp.need).trim();
  const source = asString(sp.source).trim();
  const status = asString(sp.status).trim();
  const pageSize = Math.min(toInt(asString(sp.pageSize), 50), 200);
  const page = toInt(asString(sp.page), 1);

  const supabase = supabaseAdmin();

  // options dropdown (ambil dari leads biar simple)
  const { data: optRows } = await supabase
    .from("leads")
    .select("need,source")
    .order("created_at", { ascending: false })
    .limit(500);

  const needs = Array.from(
    new Set((optRows || []).map((r: LeadOptionRow) => r.need).filter((v): v is string => Boolean(v)))
  ).sort();
  const sources = Array.from(
    new Set((optRows || []).map((r: LeadOptionRow) => r.source).filter((v): v is string => Boolean(v)))
  ).sort();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let errorMsg: string | null = null;

  let leads: LeadRow[] = [];
  let leadsCount = 0;

  let attempts: AttemptRow[] = [];
  let attemptsCount = 0;

  if (tab === "attempts") {
    let query = supabase
      .from("lead_attempts")
      .select("id,created_at,status,reason,name,phone,business,need,notes,source,ip", { count: "exact" })
      .order("created_at", { ascending: false });

    if (q) {
      const like = `%${q}%`;
      query = query.or(
        `name.ilike.${like},phone.ilike.${like},business.ilike.${like},need.ilike.${like},notes.ilike.${like},source.ilike.${like},status.ilike.${like},reason.ilike.${like}`
      );
    }
    if (need) query = query.eq("need", need);
    if (source) query = query.eq("source", source);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query.range(from, to);
    if (error) errorMsg = error.message;
    attempts = data || [];
    attemptsCount = count || 0;
  } else {
    let query = supabase
      .from("leads")
      .select("id,created_at,name,phone,business,need,notes,source", { count: "exact" })
      .order("created_at", { ascending: false });

    if (q) {
      const like = `%${q}%`;
      query = query.or(
        `name.ilike.${like},phone.ilike.${like},business.ilike.${like},need.ilike.${like},notes.ilike.${like},source.ilike.${like}`
      );
    }
    if (need) query = query.eq("need", need);
    if (source) query = query.eq("source", source);

    const { data, error, count } = await query.range(from, to);
    if (error) errorMsg = error.message;
    leads = data || [];
    leadsCount = count || 0;
  }

  const total = tab === "attempts" ? attemptsCount : leadsCount;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const makeHref = (nextPage: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (need) p.set("need", need);
    if (source) p.set("source", source);
    if (status && tab === "attempts") p.set("status", status);
    p.set("tab", tab);
    p.set("page", String(nextPage));
    p.set("pageSize", String(pageSize));
    return `/admin/leads?${p.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#070B18] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-white/70 text-sm">
              Latest data from marketing forms (and attempt logs for status badges).
            </p>
          </div>
          <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200 underline">
            Back to Home
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-3 flex gap-2">
          <Link
            href="/admin/leads?tab=leads"
            className={`rounded-full px-4 py-2 text-sm font-semibold border ${
              tab === "leads"
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Leads
          </Link>
          <Link
            href="/admin/leads?tab=attempts"
            className={`rounded-full px-4 py-2 text-sm font-semibold border ${
              tab === "attempts"
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Attempts (status)
          </Link>
        </div>

        <LeadsFilters needs={needs} sources={sources} tab={tab} />

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {errorMsg && (
            <div className="p-4 text-red-200 text-sm">Error: {errorMsg}</div>
          )}

          <div className="px-4 py-3 text-xs text-white/60">
            Showing {Math.min(pageSize, total)} of {total} records. (Page {page} / {totalPages})
          </div>

          <div className="overflow-auto">
            {tab === "attempts" ? (
              <table className="min-w-full text-sm">
                <thead className="text-white/70 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">WA</th>
                    <th className="px-4 py-3 text-left">Need</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {attempts.map((r: AttemptRow) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleString("en-US") : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={badgeClass(r.status)}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">{r.name || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.phone || "-"}</td>
                      <td className="px-4 py-3">{r.need || "-"}</td>
                      <td className="px-4 py-3 text-white/80">{r.source || "-"}</td>
                      <td className="px-4 py-3 text-white/70">{r.reason || "-"}</td>
                    </tr>
                  ))}

                  {!errorMsg && attempts.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-white/70" colSpan={7}>
                        No attempts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="text-white/70 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">WA</th>
                    <th className="px-4 py-3 text-left">Business</th>
                    <th className="px-4 py-3 text-left">Need</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {leads.map((r: LeadRow) => {
                    const summary = `Lead WA Platform\nNama: ${r.name ?? "-"}\nWA: ${r.phone ?? "-"}\nBisnis: ${r.business || "-"}\nKebutuhan: ${r.need ?? "-"}\nCatatan: ${r.notes || "-"}`;
                    return (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                          {r.created_at ? new Date(r.created_at).toLocaleString("en-US") : "-"}
                        </td>
                        <td className="px-4 py-3">{r.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{r.phone}</td>
                        <td className="px-4 py-3">{r.business || "-"}</td>
                        <td className="px-4 py-3">{r.need ?? "-"}</td>
                        <td className="px-4 py-3 text-white/80">{r.notes || "-"}</td>
                        <td className="px-4 py-3 text-white/70">{r.source || "-"}</td>
                        <td className="px-4 py-3">
                          <LeadActions phone={r.phone ?? ""} summary={summary} />
                        </td>
                      </tr>
                    );
                  })}

                  {!errorMsg && leads.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-white/70" colSpan={8}>
                        No leads yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 px-4 py-3">
            <Link
              className={`rounded-full border px-3 py-1.5 text-xs ${
                page <= 1 ? "border-white/10 text-white/30" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
              href={makeHref(Math.max(1, page - 1))}
              aria-disabled={page <= 1}
            >
              Prev
            </Link>
            <div className="text-xs text-white/60">
              {page} / {totalPages}
            </div>
            <Link
              className={`rounded-full border px-3 py-1.5 text-xs ${
                page >= totalPages ? "border-white/10 text-white/30" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
              href={makeHref(Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
