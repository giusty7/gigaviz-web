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

const schema = z.object({
  workspaceId: z.string().uuid(),
  threadId: z.string().uuid(),
  tags: z.array(z.string()).default([]),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  const { workspaceId: bodyWorkspaceId, threadId, tags } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "member"])) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  await db
    .from("wa_thread_tags")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId);

  const rows = tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({
      workspace_id: workspaceId,
      thread_id: threadId,
      tag: t,
    }));

  if (rows.length > 0) {
    try {
      await db.from("wa_thread_tags").insert(rows);
    } catch {
      // ignore duplicates
    }
  }

  return withCookies(NextResponse.json({ ok: true, tags: rows.map((r) => r.tag) }));
}
