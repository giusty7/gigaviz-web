import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  forbiddenResponse,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const workspaceSlug = url.searchParams.get("workspaceSlug");
  const phoneNumberId = url.searchParams.get("phoneNumberId");

  if (!workspaceSlug) {
    return workspaceRequiredResponse(withCookies);
  }

  const adminDb = supabaseAdmin();
  const { data: workspace, error: wsErr } = await adminDb
    .from("workspaces")
    .select("id, slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (wsErr || !workspace) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "workspace_not_found", message: "Workspace tidak ditemukan" },
        { status: 404 }
      )
    );
  }

  const { data: member } = await adminDb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!member) {
    return forbiddenResponse(withCookies);
  }

  const query = adminDb
    .from("wa_templates")
    .select(
      "id, name, language, status, category, quality_score, rejection_reason, phone_number_id, last_synced_at, updated_at, body, header, footer, buttons, meta_payload, meta_response"
    )
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  if (phoneNumberId) {
    query.eq("phone_number_id", phoneNumberId);
  }

  const { data, error } = await query;

  if (error) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "db_error",
          message: "Gagal mengambil templates",
          details: error.message,
        },
        { status: 500 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      templates: data ?? [],
    })
  );
}
