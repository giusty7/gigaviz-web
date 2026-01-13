import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordAuditEvent } from "@/lib/audit";
import {
  forbiddenResponse,
  guardWorkspace,
  requireWorkspaceRole,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "member"]),
});

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { withCookies, workspaceId, role: requesterRole, user } = guard;

  if (!requireWorkspaceRole(requesterRole, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const body = guard.body ?? (await req.json().catch(() => null));
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: bodyWorkspaceId, userId, role } = parsed.data;
  if (bodyWorkspaceId !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 400 })
    );
  }

  const db = supabaseAdmin();
  const { data: member } = await db
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) {
    return withCookies(NextResponse.json({ error: "not_found" }, { status: 404 }));
  }

  const { error } = await db
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) {
    return withCookies(NextResponse.json({ error: "db_error" }, { status: 500 }));
  }

  recordAuditEvent({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    action: "member.role_updated",
    meta: { targetUserId: userId, role },
  }).catch(() => null);

  return withCookies(NextResponse.json({ ok: true }));
}
