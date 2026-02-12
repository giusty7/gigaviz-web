import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  getWorkspaceId,
  requireWorkspaceMember,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { getUnreadCount } from "@/lib/notifications/service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const wsParam = url.searchParams.get("workspaceId") ?? undefined;
  const workspaceId = getWorkspaceId(req, undefined, wsParam);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return withCookies(NextResponse.json({ error: "forbidden" }, { status: 403 }));
  }

  const count = await getUnreadCount(workspaceId, userData.user.id);

  return withCookies(NextResponse.json({ ok: true, count }));
});
