import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { logMetaAdminAudit } from "@/lib/meta/audit";

export const runtime = "nodejs";

type ContactRow = {
  id: string;
  name: string | null;
  phone: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const { searchParams } = req.nextUrl;
  const rawLimit = Number(searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

  const { data, error } = await db
    .from("contacts")
    .select("id, name, phone")
    .eq("workspace_id", workspaceId)
    .eq("opted_in", true)
    .eq("opted_out", false)
    .order("last_seen_at", { ascending: false })
    .limit(limit);

  if (error) {
    await logMetaAdminAudit({
      db,
      workspaceId,
      userId: user?.id ?? null,
      action: "list_opted_in_contacts",
      ok: false,
      error: error.message,
    });
    return withCookies(
      NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    );
  }

  const items = (data ?? []).map((row: ContactRow) => ({
    id: row.id,
    name: row.name ?? "",
    phone: row.phone ?? "",
  }));

  await logMetaAdminAudit({
    db,
    workspaceId,
    userId: user?.id ?? null,
    action: "list_opted_in_contacts",
    ok: true,
    detail: { count: items.length },
  });

  return withCookies(NextResponse.json({ ok: true, items }));
}
