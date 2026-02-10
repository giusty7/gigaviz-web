import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminWorkspace } from "@/lib/supabase/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportQuerySchema = z.object({
  tab: z.enum(["leads", "attempts"]).optional().default("leads"),
  q: z.string().max(200).optional().default(""),
  need: z.string().max(100).optional().default(""),
  source: z.string().max(100).optional().default(""),
  status: z.string().max(50).optional().default(""),
  pageSize: z.coerce.number().int().min(1).max(2000).optional().default(500),
});

function csvEscape(v: unknown) {
  const s = (v ?? "").toString();
  const needsQuotes = /[",\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function toCSV(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(","));
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  // BOM biar Excel aman
  return "\ufeff" + lines.join("\n");
}

export async function GET(req: NextRequest) {
  // Auth check — this route was previously unprotected!
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { withCookies } = auth;

  const url = new URL(req.url);
  const queryParsed = exportQuerySchema.safeParse({
    tab: url.searchParams.get("tab") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    need: url.searchParams.get("need") ?? undefined,
    source: url.searchParams.get("source") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  if (!queryParsed.success) {
    return withCookies(
      NextResponse.json({ error: queryParsed.error.issues[0]?.message ?? "invalid_query" }, { status: 400 })
    );
  }

  const { tab, q, need, source, status, pageSize } = queryParsed.data;

  const supabase = supabaseAdmin();

  if (tab === "attempts") {
    let query = supabase
      .from("lead_attempts")
      .select("created_at,status,reason,name,phone,business,need,notes,source,ip,user_agent")
      .order("created_at", { ascending: false })
      .limit(pageSize);

    if (q) {
      const like = `%${q}%`;
      query = query.or(
        `name.ilike.${like},phone.ilike.${like},business.ilike.${like},need.ilike.${like},notes.ilike.${like},source.ilike.${like},status.ilike.${like},reason.ilike.${like}`
      );
    }
    if (need) query = query.eq("need", need);
    if (source) query = query.eq("source", source);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return new Response(`Export error: ${error.message}`, { status: 500 });

    const headers = [
      "created_at",
      "status",
      "reason",
      "name",
      "phone",
      "business",
      "need",
      "notes",
      "source",
      "ip",
      "user_agent",
    ];
    const csv = toCSV(headers, data || []);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lead_attempts.csv"`,
      },
    });
  }

  // default: leads
  let query = supabase
    .from("leads")
    .select("created_at,name,phone,business,need,notes,source")
    .order("created_at", { ascending: false })
    .limit(pageSize);

  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `name.ilike.${like},phone.ilike.${like},business.ilike.${like},need.ilike.${like},notes.ilike.${like},source.ilike.${like}`
    );
  }
  if (need) query = query.eq("need", need);
  if (source) query = query.eq("source", source);

  const { data, error } = await query;
  if (error) return new Response(`Export error: ${error.message}`, { status: 500 });

  const headers = ["created_at", "name", "phone", "business", "need", "notes", "source"];
  const csv = toCSV(headers, data || []);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads.csv"`,
    },
  });
}
