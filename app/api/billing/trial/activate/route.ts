import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { seedWorkspaceQuotas } from "@/lib/quotas";
import { logger } from "@/lib/logging";
import { sendBillingEmail } from "@/lib/billing/emails";

export const runtime = "nodejs";

const TRIAL_DAYS = 14;

const schema = z.object({
  planCode: z.enum(["starter", "growth", "business"]),
});

/**
 * POST /api/billing/trial/activate
 *
 * Activates a 14-day free trial for paid plans.
 * - Only one trial per workspace (prevents abuse)
 * - Sets status="trialing" with current_period_end = now + 14 days
 * - Seeds quotas for the plan
 * - After trial ends, workspace reverts to free unless they pay
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, user, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(
      NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    );
  }

  const limiter = rateLimit(`trial-activate:${workspaceId}`, {
    windowMs: 60_000,
    max: 5,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const body = guard.body ?? (await req.json().catch(() => null));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { planCode } = parsed.data;
  const adminDb = supabaseAdmin();

  // Check if workspace already had a trial (prevent multiple trials)
  const { data: existing } = await adminDb
    .from("subscriptions")
    .select("id, status, provider, plan_code")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existing) {
    // If they already have an active/trialing subscription, deny
    if (existing.status === "active" && existing.provider !== "manual") {
      return withCookies(
        NextResponse.json(
          { ok: false, code: "already_subscribed", message: "Workspace already has an active subscription" },
          { status: 400 }
        )
      );
    }
    if (existing.status === "trialing") {
      return withCookies(
        NextResponse.json(
          { ok: false, code: "trial_active", message: "Trial is already active for this workspace" },
          { status: 400 }
        )
      );
    }
    // If they had a previous trial that ended, also deny (one trial per workspace)
    if (existing.provider === "trial") {
      return withCookies(
        NextResponse.json(
          { ok: false, code: "trial_used", message: "Free trial has already been used for this workspace" },
          { status: 400 }
        )
      );
    }
  }

  // Activate trial
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setUTCDate(trialEnd.getUTCDate() + TRIAL_DAYS);

  const seatLimits: Record<string, number> = {
    starter: 3,
    growth: 10,
    business: 25,
  };

  const payload = {
    workspace_id: workspaceId,
    plan_id: planCode,
    plan_code: planCode,
    status: "trialing",
    current_period_start: now.toISOString(),
    current_period_end: trialEnd.toISOString(),
    provider: "trial",
    provider_ref: `trial_${workspaceId}_${Date.now()}`,
    billing_mode: "team",
    seat_limit: seatLimits[planCode] ?? 3,
    updated_at: now.toISOString(),
  };

  const { data: subscription, error } = await adminDb
    .from("subscriptions")
    .upsert(payload, { onConflict: "workspace_id" })
    .select("plan_id, plan_code, status, current_period_start, current_period_end")
    .single();

  if (error || !subscription) {
    logger.error("[trial] Failed to activate trial", { error, workspaceId, planCode });
    return withCookies(
      NextResponse.json(
        { ok: false, code: "trial_activation_failed", message: "Failed to activate trial" },
        { status: 500 }
      )
    );
  }

  // Seed quotas for the trial plan
  await seedWorkspaceQuotas(workspaceId, planCode);

  logger.info("[trial] Trial activated", {
    workspaceId,
    userId: user.id,
    planCode,
    trialEnd: trialEnd.toISOString(),
  });

  // Send trial activation email (best effort)
  try {
    if (user.email) {
      await sendBillingEmail({
        to: user.email,
        type: "trial_activated",
        data: { planName: planCode },
      });
    }
  } catch {
    // Don't fail trial activation for email errors
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      subscription,
      trialDays: TRIAL_DAYS,
      trialEnd: trialEnd.toISOString(),
    })
  );
});
