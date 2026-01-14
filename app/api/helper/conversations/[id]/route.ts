import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/helper/conversations/[id]
 * Returns a single conversation by ID.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const { id } = await params;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("helper_conversations")
    .select("id, title, created_at, updated_at")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  if (!data) {
    return withCookies(NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 }));
  }

  return withCookies(NextResponse.json({ ok: true, conversation: data }));
}

/**
 * PATCH /api/helper/conversations/[id]
 * Rename a conversation.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const title = (body?.title as string | undefined)?.trim();

  if (!title) {
    return withCookies(NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 }));
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("helper_conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id, title, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  if (!data) {
    return withCookies(NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 }));
  }

  return withCookies(NextResponse.json({ ok: true, conversation: data }));
}

/**
 * DELETE /api/helper/conversations/[id]
 * Delete a conversation and all its messages.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const { id } = await params;

  const db = supabaseAdmin();

  // Delete messages first (cascade should handle this, but explicit for safety)
  await db.from("helper_messages").delete().eq("conversation_id", id);

  // Delete the conversation
  const { error } = await db
    .from("helper_conversations")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
}
