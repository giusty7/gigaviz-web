import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isPlatformAdminById } from "@/lib/platform-admin/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assertOpsEnabled } from "@/lib/ops/guard";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  action: string;
  actor_email?: string | null;
  actor_role?: string | null;
  workspace_id?: string | null;
  target_table?: string | null;
  target_id?: string | null;
  created_at?: string | null;
  meta?: Record<string, unknown> | null;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchAllAuditRows(filters: {
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
}): Promise<AuditRow[]> {
  const db = supabaseAdmin();
  const action = (filters.action || "").trim();
  const actor = (filters.actor || "").trim();
  const from = parseDate(filters.from);
  const to = parseDate(filters.to);

  let query = db
    .from("owner_audit_log")
    .select(
      "id, action, actor_email, actor_role, workspace_id, target_table, target_id, meta, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(10000); // Max 10k rows for export

  if (action) query = query.ilike("action", `%${action}%`);
  if (actor) query = query.or(`actor_email.ilike.%${actor}%,actor_user_id.eq.${actor}`);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as AuditRow[];
}

function convertToCSV(rows: AuditRow[]): string {
  const headers = [
    "ID",
    "Action",
    "Actor Email",
    "Actor Role",
    "Workspace ID",
    "Target Table",
    "Target ID",
    "Created At",
    "Meta",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) => {
      const meta = row.meta ? JSON.stringify(row.meta).replace(/"/g, '""') : "";
      return [
        row.id,
        row.action,
        row.actor_email ?? "",
        row.actor_role ?? "",
        row.workspace_id ?? "",
        row.target_table ?? "",
        row.target_id ?? "",
        row.created_at ?? "",
        `"${meta}"`,
      ].join(",");
    }),
  ];

  return csvRows.join("\n");
}

export async function GET(req: NextRequest) {
  assertOpsEnabled();

  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platformAdmin = await isPlatformAdminById(userId);
  if (!platformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";
  const action = searchParams.get("action") || undefined;
  const actor = searchParams.get("actor") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const rows = await fetchAllAuditRows({ action, actor, from, to });

  if (format === "csv") {
    const csv = convertToCSV(rows);
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `audit-log-${timestamp}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Default: JSON
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `audit-log-${timestamp}.json`;

  return new NextResponse(JSON.stringify(rows, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
