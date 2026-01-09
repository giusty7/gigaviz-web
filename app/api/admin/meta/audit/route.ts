import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { requireEntitlement } from "@/lib/entitlements/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;

  const entitlement = await requireEntitlement(workspaceId, "audit_log");
  if (!entitlement.allowed) {
    return withCookies(
      NextResponse.json({ error: "feature_locked", feature: "audit_log" }, { status: 403 })
    );
  }
  const { searchParams } = req.nextUrl;
  const rawLimit = Number(searchParams.get("limit") || 20);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

  const { data, error } = await db
    .from("meta_admin_audit")
    .select("id, action, ok, error, detail, created_at, created_by")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ items: data ?? [] }));
}
