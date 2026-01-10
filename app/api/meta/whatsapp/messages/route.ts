import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const workspaceParam = url.searchParams.get("workspaceId") ?? undefined;
  const threadId = url.searchParams.get("threadId");
  const workspaceId = getWorkspaceId(req, undefined, workspaceParam);
  if (!workspaceId || !threadId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { data: messages } = await db
    .from("wa_messages")
    .select(
      "id, direction, content_json, status, created_at, received_at, wa_message_id, msg_type, text_body, wa_timestamp"
    )
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId)
    .order("wa_timestamp", { ascending: true });

  return withCookies(
    NextResponse.json({
      messages: messages ?? [],
    })
  );
}
