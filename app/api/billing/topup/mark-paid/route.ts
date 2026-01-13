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
import { settlePaymentIntentPaid } from "@/lib/billing/topup";

export const runtime = "nodejs";

const schema = z.object({
  workspaceSlug: z.string().min(1),
  paymentIntentId: z.string().uuid(),
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
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceSlug, paymentIntentId } = parsed.data;
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

  const settled = await settlePaymentIntentPaid(paymentIntentId, {
    workspaceId: workspace.id,
    provider: "manual",
    meta: { triggered_by: userData.user.id },
  });

  if (!settled.ok) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: settled.code, message: settled.message },
        { status: 400 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      status: settled.status,
      tokens: settled.tokens,
      paymentIntentId: settled.paymentIntentId,
    })
  );
}
