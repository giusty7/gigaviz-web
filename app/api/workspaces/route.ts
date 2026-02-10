import { NextRequest, NextResponse } from "next/server";
import { workspaceCreateSchema } from "@/lib/validation/auth";
import { recordAuditEvent } from "@/lib/audit";
import { seedWorkspaceQuotas } from "@/lib/quotas";
import { requireUser } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const userRes = await requireUser(req);
  if (!userRes.ok) return userRes.response;
  const { user, withCookies } = userRes;

  const body = await req.json().catch(() => null);
  const parsed = workspaceCreateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { name, slug, workspaceType } = parsed.data;
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("workspaces")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return withCookies(
      NextResponse.json({ error: "slug_taken", reason: "slug_taken" }, { status: 409 })
    );
  }

  const { data, error } = await db
    .from("workspaces")
    .insert({
      name: name.trim(),
      slug,
      workspace_type: workspaceType,
      owner_id: user.id,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    return withCookies(NextResponse.json({ error: "db_error" }, { status: 500 }));
  }

  const { error: memberError } = await db.from("workspace_members").insert({
    workspace_id: data.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return withCookies(
      NextResponse.json({ error: "membership_error" }, { status: 500 })
    );
  }

  recordAuditEvent({
    workspaceId: data.id,
    actorUserId: user.id,
    actorEmail: user.email,
    action: "workspace.created",
    meta: { slug, workspaceType },
  }).catch(() => null);

  // Seed default quotas for the new workspace
  seedWorkspaceQuotas(data.id, "free_locked").catch(() => null);

  return withCookies(NextResponse.json({ ok: true, workspace: data }));
});
