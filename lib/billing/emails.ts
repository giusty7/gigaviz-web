import "server-only";

import { logger } from "@/lib/logging";

/* ------------------------------------------------------------------ */
/* Billing Emails — transactional notifications via Resend             */
/*                                                                     */
/* Gracefully degrades when RESEND_API_KEY is not configured.         */
/* ------------------------------------------------------------------ */

let Resend: typeof import("resend").Resend | null = null;
let resendClient: InstanceType<typeof import("resend").Resend> | null = null;

try {
  // Dynamic import to avoid build errors if resend isn't needed
  const resendModule = await import("resend");
  Resend = resendModule.Resend;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    resendClient = new Resend(key);
  }
} catch {
  // resend not available
}

const FROM_EMAIL =
  process.env.RESEND_FROM_BILLING ??
  process.env.RESEND_FROM_AUTH ??
  "Gigaviz <billing@gigaviz.com>";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gigaviz.com";

/* ── Email Types ──────────────────────────────────────────────────── */

export type BillingEmailType =
  | "payment_success"
  | "subscription_activated"
  | "subscription_renewed"
  | "subscription_canceled"
  | "trial_activated"
  | "trial_ending"
  | "trial_expired"
  | "renewal_reminder"
  | "topup_success";

type EmailData = {
  workspaceName?: string;
  planName?: string;
  amount?: number;
  tokens?: number;
  daysLeft?: number;
  expiryDate?: string;
};

type SendBillingEmailOpts = {
  to: string;
  type: BillingEmailType;
  data: EmailData;
};

/* ── Public API ───────────────────────────────────────────────────── */

export async function sendBillingEmail(opts: SendBillingEmailOpts): Promise<void> {
  if (!resendClient) {
    logger.info("[billing-email] Skipped (no RESEND_API_KEY)", {
      type: opts.type,
      to: opts.to.replace(/(.{2}).*@/, "$1***@"),
    });
    return;
  }

  const { subject, html } = buildEmail(opts.type, opts.data);

  try {
    await resendClient.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject,
      html,
    });

    logger.info("[billing-email] Sent", {
      type: opts.type,
      to: opts.to.replace(/(.{2}).*@/, "$1***@"),
    });
  } catch (err) {
    logger.error("[billing-email] Failed to send", {
      type: opts.type,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ── Email builder (called from notification handler too) ─────── */

export async function sendPaymentSuccessEmail(
  to: string,
  data: { workspaceName: string; planName?: string; amount?: number; tokens?: number }
): Promise<void> {
  if (data.tokens) {
    await sendBillingEmail({ to, type: "topup_success", data });
  } else {
    await sendBillingEmail({ to, type: "payment_success", data });
  }
}

/* ── Template builder ─────────────────────────────────────────────── */

function buildEmail(
  type: BillingEmailType,
  data: EmailData
): { subject: string; html: string } {
  const ws = data.workspaceName ?? "your workspace";
  const plan = formatPlanName(data.planName);

  switch (type) {
    case "payment_success":
      return {
        subject: `✅ Payment confirmed — ${plan} plan activated`,
        html: wrap(`
          <h2>Payment Confirmed!</h2>
          <p>Your payment for the <strong>${plan}</strong> plan has been processed successfully for <strong>${ws}</strong>.</p>
          ${data.amount ? `<p>Amount: <strong>Rp ${formatIdr(data.amount)}</strong></p>` : ""}
          <p>Your subscription is now active. Enjoy full access to all features!</p>
          ${ctaButton("Go to Dashboard", `${APP_URL}/dashboard`)}
        `),
      };

    case "subscription_activated":
      return {
        subject: `🎉 Welcome to ${plan}! Your subscription is active`,
        html: wrap(`
          <h2>Subscription Activated!</h2>
          <p>Your <strong>${plan}</strong> plan is now active for <strong>${ws}</strong>.</p>
          <p>You now have access to all features included in your plan. Start exploring!</p>
          ${ctaButton("Explore Features", `${APP_URL}/dashboard`)}
        `),
      };

    case "subscription_renewed":
      return {
        subject: `✅ Subscription renewed — ${plan} plan`,
        html: wrap(`
          <h2>Subscription Renewed</h2>
          <p>Your <strong>${plan}</strong> plan for <strong>${ws}</strong> has been renewed successfully.</p>
          ${data.amount ? `<p>Amount: <strong>Rp ${formatIdr(data.amount)}</strong></p>` : ""}
          <p>Thank you for your continued trust in Gigaviz!</p>
        `),
      };

    case "subscription_canceled":
      return {
        subject: `⚠️ Subscription expired — ${ws}`,
        html: wrap(`
          <h2>Subscription Expired</h2>
          <p>Your <strong>${plan}</strong> plan for <strong>${ws}</strong> has expired and has been downgraded to the Free plan.</p>
          <p>To restore your features, please renew your subscription.</p>
          ${ctaButton("Renew Subscription", `${APP_URL}/dashboard`)}
        `),
      };

    case "trial_activated":
      return {
        subject: `🚀 Your 14-day free trial has started — ${plan}`,
        html: wrap(`
          <h2>Trial Started!</h2>
          <p>You now have <strong>14 days</strong> of full access to the <strong>${plan}</strong> plan for <strong>${ws}</strong>.</p>
          <p>Make the most of your trial — explore all features and see how Gigaviz can help your business grow.</p>
          ${ctaButton("Start Exploring", `${APP_URL}/dashboard`)}
        `),
      };

    case "trial_ending":
      return {
        subject: `⏰ Your trial ends in ${data.daysLeft ?? 3} days — ${ws}`,
        html: wrap(`
          <h2>Your Trial is Ending Soon</h2>
          <p>Your <strong>${plan}</strong> trial for <strong>${ws}</strong> will end on <strong>${data.expiryDate ?? "soon"}</strong>.</p>
          <p>To continue enjoying all features without interruption, subscribe now.</p>
          ${ctaButton("Subscribe Now", `${APP_URL}/dashboard`)}
          <p style="color: #888; font-size: 13px;">If you don't subscribe, your workspace will be downgraded to the Free plan.</p>
        `),
      };

    case "trial_expired":
      return {
        subject: `⚠️ Your trial has ended — ${ws}`,
        html: wrap(`
          <h2>Trial Ended</h2>
          <p>Your <strong>${plan}</strong> trial for <strong>${ws}</strong> has ended.</p>
          <p>Your workspace has been moved to the Free plan. Subscribe to get your features back!</p>
          ${ctaButton("Subscribe Now", `${APP_URL}/dashboard`)}
        `),
      };

    case "renewal_reminder":
      return {
        subject: `🔔 Subscription renewing in ${data.daysLeft ?? 7} days — ${ws}`,
        html: wrap(`
          <h2>Subscription Renewal Reminder</h2>
          <p>Your <strong>${plan}</strong> plan for <strong>${ws}</strong> will expire on <strong>${data.expiryDate ?? "soon"}</strong>.</p>
          <p>To avoid any service interruption, please ensure your payment is up to date.</p>
          ${ctaButton("Manage Billing", `${APP_URL}/dashboard`)}
        `),
      };

    case "topup_success":
      return {
        subject: `✅ ${formatTokens(data.tokens ?? 0)} tokens added to ${ws}`,
        html: wrap(`
          <h2>Tokens Added!</h2>
          <p><strong>${formatTokens(data.tokens ?? 0)} tokens</strong> have been added to <strong>${ws}</strong>.</p>
          ${data.amount ? `<p>Amount: <strong>Rp ${formatIdr(data.amount)}</strong></p>` : ""}
          <p>Your tokens are ready to use for AI generation and other features.</p>
          ${ctaButton("Use Your Tokens", `${APP_URL}/dashboard`)}
        `),
      };

    default:
      return {
        subject: `Gigaviz Billing Update`,
        html: wrap(`<p>You have a billing update for <strong>${ws}</strong>. Please check your dashboard.</p>`),
      };
  }
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatPlanName(planId?: string): string {
  if (!planId) return "Free";
  const names: Record<string, string> = {
    free: "Free",
    free_locked: "Free",
    starter: "Starter",
    growth: "Growth",
    business: "Business",
    enterprise: "Enterprise",
  };
  return names[planId] ?? planId.charAt(0).toUpperCase() + planId.slice(1);
}

function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

function formatTokens(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

function ctaButton(label: string, href: string): string {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${href}"
         style="display: inline-block; background: #06b6d4; color: #fff; padding: 12px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        ${label}
      </a>
    </div>
  `;
}

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #0a0f1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 24px; font-weight: 700; color: #06b6d4;">Gigaviz</span>
    </div>
    <!-- Card -->
    <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; color: #e5e7eb;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: #6b7280; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Gigaviz. All rights reserved.</p>
      <p><a href="${APP_URL}/policies/privacy" style="color: #06b6d4;">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`;
}
