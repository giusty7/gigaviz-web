import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { findWorkspaceBySlug } from "@/lib/meta/wa-connections";

export const runtime = "nodejs";

const schema = z.object({
  workspaceSlug: z.string().min(1),
  cap: z.number().int().min(0).max(1_000_000_000).nullable(),
});

export async function PATCH(req: NextRequest) {
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
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceSlug, cap } = parsed.data;
  const adminDb = supabaseAdmin();
  const { data: workspace } = await findWorkspaceBySlug(adminDb, workspaceSlug);
  if (!workspace) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "workspace_not_found", message: "Workspace tidak ditemukan" },
        { status: 404 }
      )
    );
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspace.id);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const { error } = await adminDb
    .from("token_wallets")
    .update({ monthly_cap: cap, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspace.id);

  if (error) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "cap_update_failed", message: error.message },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ ok: true, cap }));
}
