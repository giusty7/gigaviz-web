import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(
      NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    );
  }

  // payment_intents may need service-role for cross-table access
  const adminDb = supabaseAdmin();
  const { data, error } = await adminDb
    .from("payment_intents")
    .select("id, amount_idr, status, provider, created_at, meta")
    .eq("workspace_id", workspaceId)
    .eq("kind", "topup")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "db_error", message: error.message },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ ok: true, intents: data ?? [] }));
}
