import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/meta/whatsapp/jobs
 * List all jobs for a workspace
 */
export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { searchParams } = req.nextUrl;
  const workspaceIdParam = searchParams.get("workspaceId");
  const workspaceId = getWorkspaceId(req, undefined, workspaceIdParam ?? undefined);

  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "agent"])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();

  const { data: jobs, error: jobsErr } = await db
    .from("wa_send_jobs")
    .select(`
      id,
      name,
      status,
      total_count,
      queued_count,
      sent_count,
      failed_count,
      rate_limit_per_minute,
      started_at,
      completed_at,
      created_at,
      template:wa_templates(id, name, language)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (jobsErr) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: jobsErr.message },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ ok: true, jobs: jobs ?? [] }));
}
