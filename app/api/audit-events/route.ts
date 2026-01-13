import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const workspaceIdParam = req.nextUrl.searchParams.get("workspaceId") || undefined;
  const guard = await guardWorkspace(req, { workspaceId: workspaceIdParam });
  if (!guard.ok) return guard.response;
  const { withCookies, workspaceId } = guard;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("audit_events")
    .select("id, workspace_id, actor_user_id, actor_email, action, meta, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return withCookies(NextResponse.json({ error: "db_error" }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ events: data ?? [] }));
}
