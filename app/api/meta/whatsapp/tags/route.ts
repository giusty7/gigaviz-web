import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/meta/whatsapp/tags
 * Returns distinct tags used in the workspace for filtering
 */
export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

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
