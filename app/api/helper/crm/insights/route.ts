import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";

export const runtime = "nodejs";

// GET - List CRM insights
export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const activeOnly = url.searchParams.get("active") !== "false";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);
  let query = db
    .from("helper_crm_insights")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("insight_type", type);
  }
  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, insights: data ?? [] }));
}

// POST - Dismiss or action an insight
export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const body = await req.json().catch(() => ({}));
  const { id, action } = body;

  if (!id || !action) {
    return withCookies(NextResponse.json({ ok: false, error: "Missing id or action" }, { status: 400 }));
  }

  if (action === "dismiss") {
    const { error } = await db
      .from("helper_crm_insights")
      .update({ 
        is_active: false, 
        dismissed_at: new Date().toISOString() 
      })
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
    }
  } else if (action === "view") {
    // Get current count and increment
    const { data: current } = await db
      .from("helper_crm_insights")
      .select("viewed_count")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();
    
    await db
      .from("helper_crm_insights")
      .update({ 
        viewed_count: (current?.viewed_count ?? 0) + 1
      })
      .eq("id", id)
      .eq("workspace_id", workspaceId);
  } else if (action === "action_taken") {
    const { error } = await db
      .from("helper_crm_insights")
      .update({ 
        action_taken: true,
        action_result: body.result ?? null,
      })
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
    }
  }

  return withCookies(NextResponse.json({ ok: true }));
}
