import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { sendBillingEmail } from "@/lib/billing/emails";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET || "";

/**
 * GET /api/cron/billing
 *
 * Billing maintenance cron job. Runs daily (configured in vercel.json).
 *
 * Tasks:
 * 1. Expire trials past their period end
 * 2. Mark past-due subscriptions
 * 3. Send renewal reminder emails (7 days + 3 days before expiry)
 * 4. Send trial ending reminders (3 days before)
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = authHeader?.replace("Bearer ", "") ?? "";
  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const now = new Date();
  const results = {
    trialsExpired: 0,
    subscriptionsPastDue: 0,
    renewalReminders: 0,
    trialReminders: 0,
    errors: [] as string[],
  };

  // ── 1. Expire trials ────────────────────────────────────────────
  try {
    const { data: expiredTrials } = await db
      .from("subscriptions")
      .select("workspace_id, plan_id, current_period_end")
      .eq("status", "trialing")
      .lt("current_period_end", now.toISOString());

    if (expiredTrials && expiredTrials.length > 0) {
      for (const trial of expiredTrials) {
        await db
          .from("subscriptions")
          .update({
            status: "canceled",
            plan_id: "free_locked",
            plan_code: "free_locked",
            updated_at: now.toISOString(),
          })
          .eq("workspace_id", trial.workspace_id)
          .eq("status", "trialing");

        // Notify workspace owner
        const owner = await getWorkspaceOwnerEmail(db, trial.workspace_id);
        if (owner) {
          await sendBillingEmail({
            to: owner.email,
            type: "trial_expired",
            data: {
              workspaceName: owner.workspaceName,
              planName: trial.plan_id,
            },
          });
        }

        results.trialsExpired++;
      }

      logger.info("[billing-cron] Trials expired", {
        count: results.trialsExpired,
      });
    }
  } catch (err) {
    const msg = `Trial expiration error: ${err instanceof Error ? err.message : String(err)}`;
    results.errors.push(msg);
    logger.error("[billing-cron] " + msg);
  }

  // ── 2. Mark subscriptions past due ──────────────────────────────
  try {
    const { data: expiredSubs } = await db
      .from("subscriptions")
      .select("workspace_id, plan_id, current_period_end")
      .eq("status", "active")
      .neq("provider", "manual")
      .neq("provider", "trial")
      .lt("current_period_end", now.toISOString());

    if (expiredSubs && expiredSubs.length > 0) {
      for (const sub of expiredSubs) {
        // Grace period: 7 days after expiry before downgrade
        const expiryDate = new Date(sub.current_period_end);
        const daysSinceExpiry = Math.floor(
          (now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceExpiry > 7) {
          // Past grace period: downgrade to free
          await db
            .from("subscriptions")
            .update({
              status: "canceled",
              plan_id: "free_locked",
              plan_code: "free_locked",
              updated_at: now.toISOString(),
            })
            .eq("workspace_id", sub.workspace_id)
            .eq("status", "active");

          const owner = await getWorkspaceOwnerEmail(db, sub.workspace_id);
          if (owner) {
            await sendBillingEmail({
              to: owner.email,
              type: "subscription_canceled",
              data: {
                workspaceName: owner.workspaceName,
                planName: sub.plan_id,
              },
            });
          }
        } else {
          // Within grace period: mark as past_due
          await db
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: now.toISOString(),
            })
            .eq("workspace_id", sub.workspace_id)
            .eq("status", "active");
        }

        results.subscriptionsPastDue++;
      }

      logger.info("[billing-cron] Subscriptions past due processed", {
        count: results.subscriptionsPastDue,
      });
    }
  } catch (err) {
    const msg = `Past due error: ${err instanceof Error ? err.message : String(err)}`;
    results.errors.push(msg);
    logger.error("[billing-cron] " + msg);
  }

  // ── 3. Renewal reminder emails (7 days and 3 days before) ──────
  try {
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setUTCDate(sevenDaysFromNow.getUTCDate() + 7);
    const sixDaysFromNow = new Date(now);
    sixDaysFromNow.setUTCDate(sixDaysFromNow.getUTCDate() + 6);

    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setUTCDate(threeDaysFromNow.getUTCDate() + 3);
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setUTCDate(twoDaysFromNow.getUTCDate() + 2);

    // 7-day window: expiring between 6-7 days from now
    const { data: subs7day } = await db
      .from("subscriptions")
      .select("workspace_id, plan_id, current_period_end")
      .eq("status", "active")
      .neq("provider", "manual")
      .neq("provider", "trial")
      .gte("current_period_end", sixDaysFromNow.toISOString())
      .lt("current_period_end", sevenDaysFromNow.toISOString());

    // 3-day window: expiring between 2-3 days from now
    const { data: subs3day } = await db
      .from("subscriptions")
      .select("workspace_id, plan_id, current_period_end")
      .eq("status", "active")
      .neq("provider", "manual")
      .neq("provider", "trial")
      .gte("current_period_end", twoDaysFromNow.toISOString())
      .lt("current_period_end", threeDaysFromNow.toISOString());

    const subsToRemind = [
      ...(subs7day ?? []).map((s) => ({ ...s, daysLeft: 7 })),
      ...(subs3day ?? []).map((s) => ({ ...s, daysLeft: 3 })),
    ];

    for (const sub of subsToRemind) {
      const owner = await getWorkspaceOwnerEmail(db, sub.workspace_id);
      if (owner) {
        await sendBillingEmail({
          to: owner.email,
          type: "renewal_reminder",
          data: {
            workspaceName: owner.workspaceName,
            planName: sub.plan_id,
            daysLeft: sub.daysLeft,
            expiryDate: new Date(sub.current_period_end).toLocaleDateString("id-ID"),
          },
        });
        results.renewalReminders++;
      }
    }

    if (results.renewalReminders > 0) {
      logger.info("[billing-cron] Renewal reminders sent", {
        count: results.renewalReminders,
      });
    }
  } catch (err) {
    const msg = `Renewal reminder error: ${err instanceof Error ? err.message : String(err)}`;
    results.errors.push(msg);
    logger.error("[billing-cron] " + msg);
  }

  // ── 4. Trial ending reminders (3 days before) ──────────────────
  try {
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setUTCDate(threeDaysFromNow.getUTCDate() + 3);
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setUTCDate(twoDaysFromNow.getUTCDate() + 2);

    const { data: endingTrials } = await db
      .from("subscriptions")
      .select("workspace_id, plan_id, current_period_end")
      .eq("status", "trialing")
      .gte("current_period_end", twoDaysFromNow.toISOString())
      .lt("current_period_end", threeDaysFromNow.toISOString());

    for (const trial of endingTrials ?? []) {
      const owner = await getWorkspaceOwnerEmail(db, trial.workspace_id);
      if (owner) {
        await sendBillingEmail({
          to: owner.email,
          type: "trial_ending",
          data: {
            workspaceName: owner.workspaceName,
            planName: trial.plan_id,
            expiryDate: new Date(trial.current_period_end).toLocaleDateString("id-ID"),
          },
        });
        results.trialReminders++;
      }
    }

    if (results.trialReminders > 0) {
      logger.info("[billing-cron] Trial reminders sent", {
        count: results.trialReminders,
      });
    }
  } catch (err) {
    const msg = `Trial reminder error: ${err instanceof Error ? err.message : String(err)}`;
    results.errors.push(msg);
    logger.error("[billing-cron] " + msg);
  }

  // ── Summary ─────────────────────────────────────────────────────
  logger.info("[billing-cron] Completed", results);

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    ...results,
  });
});

/* ── Helper: resolve workspace owner email ─────────────────────── */

async function getWorkspaceOwnerEmail(
  db: ReturnType<typeof supabaseAdmin>,
  workspaceId: string
): Promise<{ email: string; workspaceName: string } | null> {
  const { data: workspace } = await db
    .from("workspaces")
    .select("name, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace?.owner_id) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("email")
    .eq("id", workspace.owner_id)
    .maybeSingle();

  if (!profile?.email) return null;

  return { email: profile.email, workspaceName: workspace.name ?? "Your workspace" };
}
