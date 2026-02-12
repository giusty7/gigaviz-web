import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { evaluateRulesForThread } from "@/lib/meta/automation-engine";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  threadId: z.string().uuid(),
  assignedTo: z.string().uuid().nullable().optional(),
  status: z.string().optional(),
});

export const runtime = "nodejs";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies } = guard;

  const parsed = schema.safeParse(guard.body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { threadId, assignedTo, status } = parsed.data;
  const db = supabaseAdmin();

  const updatePayload: Record<string, unknown> = {};
  if (status) updatePayload.status = status;
  if (assignedTo !== undefined) updatePayload.assigned_to = assignedTo;
  updatePayload.updated_at = new Date().toISOString();

  if (Object.keys(updatePayload).length === 0) {
    return withCookies(NextResponse.json({ ok: true, skipped: true }));
  }

  const { error } = await db
    .from("wa_threads")
    .update(updatePayload)
    .eq("workspace_id", workspaceId)
    .eq("id", threadId);

  if (error) {
    return withCookies(
      NextResponse.json({ error: "db_error", reason: "thread_update_failed" }, { status: 500 })
    );
  }

  // Trigger automation rules for status/assignment changes
  // Run in background - don't block response
  if (status) {
    evaluateRulesForThread({
      workspaceId,
      threadId,
      triggerType: 'status_changed',
      triggerData: { 
        newStatus: status,
        changedBy: user.id,
      },
    }).catch((error) => {
      logger.warn('[update-api] Automation rules evaluation failed (status)', {
        threadId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  if (assignedTo !== undefined) {
    evaluateRulesForThread({
      workspaceId,
      threadId,
      triggerType: 'assigned',
      triggerData: { 
        assignedTo: assignedTo ?? null,
        assignedBy: user.id,
      },
    }).catch((error) => {
      logger.warn('[update-api] Automation rules evaluation failed (assigned)', {
        threadId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  return withCookies(NextResponse.json({ ok: true }));
});
