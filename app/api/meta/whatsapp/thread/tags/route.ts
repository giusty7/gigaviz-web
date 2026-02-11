import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { evaluateRulesForThread } from "@/lib/meta/automation-engine";
import { logger } from "@/lib/logging";

const schema = z.object({
  threadId: z.string().uuid(),
  tags: z.array(z.string()).default([]),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  const { threadId, tags } = parsed.data;

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

  // Trigger automation rules for tag changes
  // Run in background - don't block response
  evaluateRulesForThread({
    workspaceId,
    threadId,
    triggerType: 'tag_added',
    triggerData: { 
      tags: rows.map((r) => r.tag),
      addedBy: user.id,
    },
  }).catch((error) => {
    logger.warn('[tags-api] Automation rules evaluation failed', {
      threadId,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return withCookies(NextResponse.json({ ok: true, tags: rows.map((r) => r.tag) }));
}
