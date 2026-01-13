import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { recordAuditEvent } from "@/lib/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
  moduleKey: z.string().min(1),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { withCookies, user, workspaceId, body } = guard;

  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "invalid_payload", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: bodyWorkspaceId, moduleKey, notes } = parsed.data;
  if (bodyWorkspaceId !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch", reason: "workspace_mismatch" }, { status: 400 })
    );
  }

  const db = supabaseAdmin();
  const { error } = await db.from("feature_interest").insert({
    workspace_id: workspaceId,
    user_id: user.id,
    module_key: moduleKey,
    notes: notes?.trim() || null,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[feature-interest] insert failed", {
        message: error.message,
        code: error.code ?? null,
        details: error.details ?? null,
      });
    }

    return withCookies(NextResponse.json({ error: "db_error" }, { status: 500 }));
  }

  recordAuditEvent({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    action: "feature.interest",
    meta: { moduleKey },
  }).catch(() => null);

  return withCookies(NextResponse.json({ ok: true }));
}
