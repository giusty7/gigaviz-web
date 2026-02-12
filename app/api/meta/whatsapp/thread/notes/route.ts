import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  workspaceId: z.string().uuid(),
  threadId: z.string().uuid(),
  body: z.string().min(1),
});

export const runtime = "nodejs";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: bodyWorkspaceId, threadId, body: noteBody } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "member"])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { data: note, error: insertError } = await db
    .from("wa_thread_notes")
    .insert({
      workspace_id: workspaceId,
      thread_id: threadId,
      author_id: userData.user.id,
      body: noteBody,
    })
    .select("id, author_id, body, created_at")
    .single();

  if (insertError) {
    return withCookies(
      NextResponse.json({ error: "db_error", reason: "note_failed" }, { status: 500 })
    );
  }

  return withCookies(NextResponse.json({ ok: true, note }));
});
