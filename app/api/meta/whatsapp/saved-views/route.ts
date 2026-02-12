import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { forbiddenResponse, requireWorkspaceMember, unauthorizedResponse } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const filtersSchema = z.object({
  status: z.string().optional(),
  assigned: z.string().optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
});

const createSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  filters: filtersSchema,
});

const deleteSchema = z.object({
  workspaceId: z.string().uuid(),
  viewId: z.string().uuid(),
});

/**
 * GET /api/meta/whatsapp/saved-views?workspaceId=<uuid>
 * Returns user's saved views for the workspace
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
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
  const { data: views, error } = await db
    .from("wa_saved_views")
    .select("id, name, filters, created_at")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "failed_to_fetch_views" },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ views: views ?? [] }));
});

/**
 * POST /api/meta/whatsapp/saved-views
 * Create a new saved view
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId, name, filters } = parsed.data;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { data: view, error: insertError } = await db
    .from("wa_saved_views")
    .insert({
      workspace_id: workspaceId,
      user_id: userData.user.id,
      name,
      filters,
    })
    .select("id, name, filters, created_at")
    .single();

  if (insertError) {
    // Check for unique constraint violation
    if (insertError.code === "23505") {
      return withCookies(
        NextResponse.json(
          { error: "conflict", reason: "view_name_already_exists" },
          { status: 409 }
        )
      );
    }
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "failed_to_create_view" },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ view }));
});

/**
 * DELETE /api/meta/whatsapp/saved-views
 * Delete a saved view
 */
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId, viewId } = parsed.data;

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { error: deleteError } = await db
    .from("wa_saved_views")
    .delete()
    .eq("id", viewId)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id);

  if (deleteError) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "failed_to_delete_view" },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ ok: true }));
});
