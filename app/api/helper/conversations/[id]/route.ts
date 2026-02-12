import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const patchConversationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
});

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/helper/conversations/[id]
 * Returns a single conversation by ID.
 */
export const GET = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { id } = await params;

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
});

/**
 * PATCH /api/helper/conversations/[id]
 * Rename a conversation.
 */
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchConversationSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(NextResponse.json({ ok: false, error: "Title is required", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 }));
  }
  const { title } = parsed.data;

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
});

/**
 * DELETE /api/helper/conversations/[id]
 * Delete a conversation and all its messages.
 */
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { id } = await params;

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
});
