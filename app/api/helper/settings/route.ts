import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { getHelperSettings } from "@/lib/helper/settings";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const settings = await getHelperSettings(workspaceId);
  return withCookies(NextResponse.json({ ok: true, settings }));
}

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }));
  }

  const body = await req.json().catch(() => ({}));
  const allow = Boolean(body?.allow_automation ?? body?.allowAutomation ?? true);
  const monthlyCap = Number(body?.monthly_cap ?? body?.monthlyCap ?? 0);

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("helper_settings")
    .upsert(
      {
        workspace_id: workspaceId,
        allow_automation: allow,
        monthly_cap: Number.isFinite(monthlyCap) ? monthlyCap : 0,
      },
      { onConflict: "workspace_id" }
    )
    .select("workspace_id, allow_automation, monthly_cap")
    .maybeSingle();

  if (error || !data) {
    return withCookies(
      NextResponse.json({ ok: false, error: error?.message ?? "failed" }, { status: 500 })
    );
  }

  return withCookies(NextResponse.json({ ok: true, settings: data }));
}
