import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBillingSummary } from "@/lib/billing/summary";
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
  const { data: workspace, error: wsError } = await findWorkspaceBySlug(
    adminDb,
    workspaceSlug
  );
  if (wsError || !workspace) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "workspace_not_found", message: "Workspace tidak ditemukan" },
        { status: 404 }
      )
    );
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspace.id);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const summary = await getBillingSummary(workspace.id);
  return withCookies(NextResponse.json({ ok: true, summary }));
}
