import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const schema = z.object({
  planCode: z.string().min(1),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, user, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(
      NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    );
  }

  const limiter = rateLimit(`billing-subscription-set:${user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const body = guard.body ?? await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { planCode } = parsed.data;
  // plans + subscriptions need service-role for lookups and upserts
  const adminDb = supabaseAdmin();
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
    workspace_id: workspaceId,
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
});
