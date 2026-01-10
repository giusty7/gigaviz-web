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
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  workspaceId: z.string().uuid(),
  threadId: z.string().uuid(),
  text: z.string().min(1),
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

  const { workspaceId: bodyWorkspaceId, threadId, text } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "member"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-send-text:${workspaceId}:${userData.user.id}`, { windowMs: 60_000, max: 10 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const db = supabaseAdmin();
  const { data: thread } = await db
    .from("wa_threads")
    .select("id, phone_number_id, contact_wa_id")
    .eq("workspace_id", workspaceId)
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "thread_not_found" }, { status: 404 })
    );
  }

  const now = new Date().toISOString();

  try {
    await db
      .from("wa_messages")
      .insert({
        workspace_id: workspaceId,
        thread_id: threadId,
        phone_number_id: thread.phone_number_id ?? "unknown",
        wa_message_id: null,
        direction: "out",
        msg_type: "text",
        text_body: text,
        content_json: { text },
        status: "queued",
        wa_timestamp: now,
        created_at: now,
        updated_at: now,
        from_wa_id: null,
        to_wa_id: thread.contact_wa_id ?? null,
      });
  } catch (err) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "insert_failed", message: err instanceof Error ? err.message : "unknown" },
        { status: 500 }
      )
    );
  }

  await db
    .from("wa_threads")
    .update({
      last_message_at: now,
      last_message_preview: text.slice(0, 160),
      updated_at: now,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", threadId);

  return withCookies(
    NextResponse.json({
      ok: true,
      status: "queued",
    })
  );
}
