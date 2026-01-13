import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { recordAuditEvent } from "@/lib/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
  planId: z.string().min(1),
  seats: z.number().int().min(1).max(10_000),
  notes: z.string().max(2_000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { user, workspaceId, withCookies, body } = guard;

  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "invalid_payload", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: payloadWorkspaceId, planId, seats, notes } = parsed.data;

  if (payloadWorkspaceId !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch", reason: "workspace_mismatch" }, { status: 400 })
    );
  }

  const db = supabaseAdmin();
  const { error } = await db.from("billing_requests").insert({
    workspace_id: workspaceId,
    user_id: user.id,
    plan_id: planId,
    seats,
    notes: notes?.trim() ? notes.trim() : null,
    status: "pending",
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[billing-requests] insert failed", {
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
    action: "billing.requested",
    meta: { planId, seats },
  }).catch(() => null);

  return withCookies(NextResponse.json({ ok: true }));
}
