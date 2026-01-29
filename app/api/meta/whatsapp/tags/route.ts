import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { forbiddenResponse, requireWorkspaceMember, unauthorizedResponse } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/meta/whatsapp/tags
 * Returns distinct tags used in the workspace for filtering
 */
export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");

  if (!workspaceId) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "workspace_id_required" },
        { status: 400 }
      )
    );
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  
  // Get distinct tags from wa_thread_tags table, sorted alphabetically
  // This provides the list of available tags for the filter dropdown
  const { data: rows, error } = await db
    .from("wa_thread_tags")
    .select("tag")
    .eq("workspace_id", workspaceId)
    .order("tag", { ascending: true });

  if (error) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "failed_to_fetch_tags" },
        { status: 500 }
      )
    );
  }

  // Get unique tags
  const uniqueTags = Array.from(new Set(rows?.map((r) => r.tag) ?? []));

  return withCookies(NextResponse.json({ tags: uniqueTags }));
}
