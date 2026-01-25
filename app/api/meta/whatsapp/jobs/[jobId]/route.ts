import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ jobId: string }> };

/**
 * GET /api/meta/whatsapp/jobs/[jobId]
 * Get job details including items
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { jobId } = await params;
  const db = supabaseAdmin();

  // Fetch job
  const { data: job, error: jobErr } = await db
    .from("wa_send_jobs")
    .select(`
      id,
      workspace_id,
      connection_id,
      template_id,
      name,
      status,
      total_count,
      queued_count,
      sent_count,
      failed_count,
      global_values,
      rate_limit_per_minute,
      started_at,
      completed_at,
      created_at,
      template:wa_templates(id, name, language, variable_count)
    `)
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr || !job) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "job_not_found" }, { status: 404 })
    );
  }

  // Verify workspace membership
  const membership = await requireWorkspaceMember(userData.user.id, job.workspace_id);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "agent"])) {
    return forbiddenResponse(withCookies);
  }

  // Fetch items
  const { searchParams } = req.nextUrl;
  const statusFilter = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  let itemsQuery = db
    .from("wa_send_job_items")
    .select("id, contact_id, to_phone, params, status, wa_message_id, error_message, sent_at, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter) {
    itemsQuery = itemsQuery.eq("status", statusFilter);
  }

  const { data: items, error: itemsErr, count } = await itemsQuery;

  if (itemsErr) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: itemsErr.message },
        { status: 500 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      job,
      items: items ?? [],
      pagination: {
        limit,
        offset,
        total: count ?? items?.length ?? 0,
      },
    })
  );
}
