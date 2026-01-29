import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { forbiddenResponse, requireWorkspaceMember, unauthorizedResponse } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * DELETE /api/meta/whatsapp/saved-views/[id]
 * Delete a specific saved view by ID
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { id: viewId } = await params;
  
  const body = await req.json().catch(() => ({}));
  const workspaceId = body.workspaceId;

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
  
  // Verify ownership before deleting
  const { data: existing } = await db
    .from("wa_saved_views")
    .select("id")
    .eq("id", viewId)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id)
    .single();

  if (!existing) {
    return withCookies(
      NextResponse.json(
        { error: "not_found", reason: "view_not_found_or_no_access" },
        { status: 404 }
      )
    );
  }

  const { error: deleteError } = await db
    .from("wa_saved_views")
    .delete()
    .eq("id", viewId);

  if (deleteError) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "failed_to_delete_view" },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ ok: true }));
}

/**
 * PUT /api/meta/whatsapp/saved-views/[id]
 * Update a saved view
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { id: viewId } = await params;
  
  const body = await req.json().catch(() => ({}));
  const { workspaceId, name, filters, isDefault } = body;

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
  
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (filters !== undefined) updates.filters = filters;
  if (isDefault !== undefined) updates.is_default = isDefault;

  if (Object.keys(updates).length === 0) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "no_updates_provided" },
        { status: 400 }
      )
    );
  }

  const { data: view, error: updateError } = await db
    .from("wa_saved_views")
    .update(updates)
    .eq("id", viewId)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id)
    .select("id, name, filters, is_default, created_at")
    .single();

  if (updateError) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "failed_to_update_view" },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ view }));
}
