import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  getWorkspaceId,
  requireWorkspaceMember,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { markAsRead, markAllAsRead } from "@/lib/notifications/service";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
  notificationIds: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional(),
});

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
        { error: "bad_request", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: bodyWorkspaceId, notificationIds, markAll } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return withCookies(NextResponse.json({ error: "forbidden" }, { status: 403 }));
  }

  if (markAll) {
    const result = await markAllAsRead(workspaceId, userData.user.id);
    return withCookies(NextResponse.json({ ok: result.ok }));
  }

  if (notificationIds && notificationIds.length > 0) {
    const result = await markAsRead(workspaceId, userData.user.id, notificationIds);
    return withCookies(NextResponse.json({ ok: result.ok }));
  }

  return withCookies(NextResponse.json({ ok: true, skipped: true }));
}
