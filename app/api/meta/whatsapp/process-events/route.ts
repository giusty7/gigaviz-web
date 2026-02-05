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

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const reconcile =
    url.searchParams.get("reconcile") === "1" || Boolean(body?.reconcile);
  const workspaceId = getWorkspaceId(req, undefined, body.workspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "member"])) {
    return forbiddenResponse(withCookies);
  }

  const result = await processWhatsappEvents(workspaceId, 20, {
    reconcile,
    reconcileLimit: 100,
  });

  // AI Auto-Reply is handled by the AI Reply Worker (scripts/ai-reply-worker.ts)
  const aiTriggered = 0;

  return withCookies(
    NextResponse.json({
      ok: true,
      processedEvents: result.processed,
      insertedMessages: result.messagesCreated,
      updatedThreads: result.threadsTouched,
      threadsTouched: result.threadsTouched,
      statusEvents: result.statusEvents,
      reconciledEvents: result.reconciledEvents,
      reconciledMessages: result.reconciledMessages,
      reconciledThreads: result.reconciledThreads,
      errors: result.errors,
      processed: result.processed,
      messagesCreated: result.messagesCreated,
      threadsCreated: result.threadsTouched,
      aiTriggered,
    })
  );
}
