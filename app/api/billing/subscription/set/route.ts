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
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  workspaceSlug: z.string().min(1),
  planCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const limiter = rateLimit(`billing-subscription-set:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
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

  const { workspaceSlug, planCode } = parsed.data;
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

  const { data: plan } = await adminDb
    .from("plans")
    .select("code, type, seat_limit, is_active")
    .eq("code", planCode)
    .maybeSingle();

  if (!plan?.code) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "plan_not_found", message: "Plan not found" },
        { status: 404 }
      )
    );
  }

  if (plan.is_active === false) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "plan_inactive", message: "Plan is not active" },
        { status: 400 }
      )
    );
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 30);

  const payload = {
    workspace_id: workspace.id,
    plan_id: plan.code,
    plan_code: plan.code,
    status: "active",
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    provider: "manual",
    provider_ref: "manual",
    billing_mode: plan.type === "team" ? "team" : "individual",
    seat_limit: plan.seat_limit ?? (plan.type === "team" ? 5 : 1),
    updated_at: now.toISOString(),
  };

  const { data: subscription, error } = await adminDb
    .from("subscriptions")
    .upsert(payload, { onConflict: "workspace_id" })
    .select(
      "plan_id, plan_code, status, current_period_start, current_period_end, provider, provider_ref"
    )
    .single();

  if (error || !subscription) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "subscription_update_failed", message: error?.message ?? "Gagal update subscription" },
        { status: 500 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      subscription,
    })
  );
}
