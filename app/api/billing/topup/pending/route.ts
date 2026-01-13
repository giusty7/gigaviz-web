import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findWorkspaceBySlug } from "@/lib/meta/wa-connections";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const workspaceSlug = url.searchParams.get("workspaceSlug");
  if (!workspaceSlug) {
    return workspaceRequiredResponse(withCookies);
  }

  const adminDb = supabaseAdmin();
  const { data: workspace } = await findWorkspaceBySlug(adminDb, workspaceSlug);
  if (!workspace) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "workspace_not_found", message: "Workspace tidak ditemukan" },
        { status: 404 }
      )
    );
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspace.id);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const { data, error } = await adminDb
    .from("payment_intents")
    .select("id, amount_idr, status, provider, created_at, meta")
    .eq("workspace_id", workspace.id)
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
