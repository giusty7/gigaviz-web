import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("leads")
    .select("id,name,phone,business,need,notes,source,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="min-h-screen bg-[#070B18] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-white/70 text-sm">Data terbaru dari form /wa-platform</p>
          </div>
          <a
            href="/"
            className="text-sm text-cyan-300 hover:text-cyan-200 underline"
          >
            Kembali ke Home
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {error && (
            <div className="p-4 text-red-200 text-sm">
              Error: {error.message}
            </div>
          )}

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
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {(data || []).map((r) => {
                  const wa = (r.phone || "").replace(/^0/, "62");
                  const waLink = `https://wa.me/${wa}`;
                  return (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.phone}</td>
                      <td className="px-4 py-3">{r.business || "-"}</td>
                      <td className="px-4 py-3">{r.need}</td>
                      <td className="px-4 py-3 text-white/80">{r.notes || "-"}</td>
                      <td className="px-4 py-3">
                        <a
                          className="text-cyan-300 hover:text-cyan-200 underline"
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Chat
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {!error && (!data || data.length === 0) && (
                  <tr>
                    <td className="px-4 py-6 text-white/70" colSpan={7}>
                      Belum ado lead.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 text-xs text-white/60">
            Menampilkan max 200 data terbaru.
          </div>
        </div>
      </div>
    </div>
  );
}
