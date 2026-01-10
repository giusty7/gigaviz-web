import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { processWhatsappEvents } from "@/lib/meta/wa-inbox";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: false, message: "Use POST to process events" });
}

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => ({}));
  const workspaceId = getWorkspaceId(req, undefined, body.workspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "member"])) {
    return forbiddenResponse(withCookies);
  }

  const result = await processWhatsappEvents(workspaceId, 20);

  return withCookies(
    NextResponse.json({
      ok: true,
      processed: result.processed,
      messagesCreated: result.messagesCreated,
      threadsCreated: result.threadsTouched,
      statusEvents: result.statusEvents,
      errors: result.errors,
    })
  );
}
