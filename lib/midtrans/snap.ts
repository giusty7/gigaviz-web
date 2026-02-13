import "server-only";

/* ------------------------------------------------------------------ */
/* Midtrans Snap — high-level helpers for subscriptions & top-ups     */
/*                                                                     */
/* Architecture note:                                                  */
/* Most Indonesian payment methods (bank transfer, e-wallets, QRIS)   */
/* do NOT support auto-recurring. We use Snap for each payment cycle  */
/* and track subscription state server-side.                           */
/* ------------------------------------------------------------------ */

import { snapCreateTransaction } from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/* ── Plan pricing (IDR) ──────────────────────────────────────────── */

export const PLAN_PRICES: Record<
  string,
  { monthly: number; yearly: number; name: string }
> = {
  starter: { monthly: 149_000, yearly: 1_428_000, name: "Starter" },
  growth: { monthly: 399_000, yearly: 3_828_000, name: "Growth" },
  business: { monthly: 899_000, yearly: 8_628_000, name: "Business" },
};

/* ── Token top-up packages ───────────────────────────────────────── */

export const TOKEN_PACKAGES: Record<
  string,
  { tokens: number; priceIdr: number; label: string }
> = {
  pkg_50k: { tokens: 50_000, priceIdr: 50_000, label: "50.000 Tokens" },
  pkg_100k: { tokens: 105_000, priceIdr: 100_000, label: "100.000 + Bonus" },
  pkg_500k: { tokens: 550_000, priceIdr: 500_000, label: "500.000 + Bonus" },
};

/* ── Subscription Snap ───────────────────────────────────────────── */

export type SubscriptionSnapOptions = {
  workspaceId: string;
  workspaceSlug: string;
  planCode: string;
  interval: "monthly" | "yearly";
  customerEmail: string;
  customerName: string;
  isRenewal?: boolean;
};

type SnapResult =
  | { ok: true; token: string; redirectUrl: string; orderId: string }
  | { ok: false; code: string; message: string };

export async function createSubscriptionSnap(
  opts: SubscriptionSnapOptions
): Promise<SnapResult> {
  const pricing = PLAN_PRICES[opts.planCode];
  if (!pricing) {
    return { ok: false, code: "invalid_plan", message: `Unknown plan: ${opts.planCode}` };
  }

  const amount =
    opts.interval === "yearly" ? pricing.yearly : pricing.monthly;
  const intervalLabel = opts.interval === "yearly" ? "Annual" : "Monthly";
  const renewTag = opts.isRenewal ? "RNW" : "NEW";
  const orderId = `SUB-${opts.planCode.toUpperCase()}-${renewTag}-${opts.workspaceId.slice(0, 8)}-${Date.now()}`;

  const db = supabaseAdmin();

  // 1. Store payment intent
  const { data: intent, error: insertErr } = await db
    .from("payment_intents")
    .insert({
      workspace_id: opts.workspaceId,
      kind: "subscription",
      amount_idr: amount,
      status: "pending",
      provider: "midtrans",
      provider_ref: orderId,
      meta: {
        plan_code: opts.planCode,
        interval: opts.interval,
        is_renewal: opts.isRenewal ?? false,
      },
    })
    .select("id")
    .single();

  if (insertErr || !intent) {
    logger.error("[midtrans] Failed to create payment intent", {
      error: insertErr?.message,
      orderId,
    });
    return { ok: false, code: "db_error", message: "Failed to create payment record" };
  }

  try {
    // 2. Create Snap transaction
    const snap = await snapCreateTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      item_details: [
        {
          id: opts.planCode,
          price: amount,
          quantity: 1,
          name: `Gigaviz ${pricing.name} Plan (${intervalLabel})`,
        },
      ],
      customer_details: {
        email: opts.customerEmail,
        first_name: opts.customerName,
      },
      callbacks: {
        finish: `${APP_URL}/${opts.workspaceSlug}/settings/billing?payment=success&plan=${opts.planCode}`,
        error: `${APP_URL}/${opts.workspaceSlug}/settings/billing?payment=error`,
        pending: `${APP_URL}/${opts.workspaceSlug}/settings/billing?payment=pending`,
      },
      custom_field1: opts.workspaceId,
      custom_field2: opts.planCode,
      custom_field3: opts.interval,
      custom_field4: intent.id,
      expiry: {
        unit: "hours",
        duration: 24,
      },
    });

    // 3. Store checkout URL
    await db
      .from("payment_intents")
      .update({
        checkout_url: snap.redirect_url,
        meta: {
          plan_code: opts.planCode,
          interval: opts.interval,
          is_renewal: opts.isRenewal ?? false,
          snap_token: snap.token,
        },
      })
      .eq("id", intent.id);

    logger.info("[midtrans] Subscription Snap created", {
      orderId,
      planCode: opts.planCode,
      amount,
      interval: opts.interval,
    });

    return {
      ok: true,
      token: snap.token,
      redirectUrl: snap.redirect_url,
      orderId,
    };
  } catch (err) {
    logger.error("[midtrans] Snap creation failed", {
      error: err instanceof Error ? err.message : String(err),
      orderId,
    });

    await db
      .from("payment_intents")
      .update({ status: "failed" })
      .eq("id", intent.id);

    return {
      ok: false,
      code: "midtrans_error",
      message: err instanceof Error ? err.message : "Failed to create payment",
    };
  }
}

/* ── Token Top-up Snap ───────────────────────────────────────────── */

export type TokenTopupSnapOptions = {
  workspaceId: string;
  workspaceSlug: string;
  packageId: string;
  customerEmail: string;
  customerName: string;
};

export async function createTokenTopupSnap(
  opts: TokenTopupSnapOptions
): Promise<SnapResult> {
  const pkg = TOKEN_PACKAGES[opts.packageId];
  if (!pkg) {
    return { ok: false, code: "invalid_package", message: `Unknown package: ${opts.packageId}` };
  }

  const orderId = `TOPUP-${opts.workspaceId.slice(0, 8)}-${Date.now()}`;
  const db = supabaseAdmin();

  // 1. Store payment intent
  const { data: intent, error: insertErr } = await db
    .from("payment_intents")
    .insert({
      workspace_id: opts.workspaceId,
      kind: "topup",
      amount_idr: pkg.priceIdr,
      status: "pending",
      provider: "midtrans",
      provider_ref: orderId,
      meta: {
        type: "token_topup",
        token_amount: pkg.tokens,
        package_id: opts.packageId,
      },
    })
    .select("id")
    .single();

  if (insertErr || !intent) {
    logger.error("[midtrans] Failed to create topup intent", {
      error: insertErr?.message,
      orderId,
    });
    return { ok: false, code: "db_error", message: "Failed to create payment record" };
  }

  try {
    // 2. Create Snap transaction
    const snap = await snapCreateTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: pkg.priceIdr,
      },
      item_details: [
        {
          id: opts.packageId,
          price: pkg.priceIdr,
          quantity: 1,
          name: `${pkg.tokens.toLocaleString("id-ID")} AI Tokens`,
        },
      ],
      customer_details: {
        email: opts.customerEmail,
        first_name: opts.customerName,
      },
      callbacks: {
        finish: `${APP_URL}/${opts.workspaceSlug}/settings/billing?topup=success`,
        error: `${APP_URL}/${opts.workspaceSlug}/settings/billing?topup=error`,
        pending: `${APP_URL}/${opts.workspaceSlug}/settings/billing?topup=pending`,
      },
      custom_field1: opts.workspaceId,
      custom_field2: "token_topup",
      custom_field3: String(pkg.tokens),
      custom_field4: intent.id,
      expiry: {
        unit: "hours",
        duration: 24,
      },
    });

    // 3. Update with checkout URL
    await db
      .from("payment_intents")
      .update({
        checkout_url: snap.redirect_url,
        meta: {
          type: "token_topup",
          token_amount: pkg.tokens,
          package_id: opts.packageId,
          snap_token: snap.token,
        },
      })
      .eq("id", intent.id);

    logger.info("[midtrans] Topup Snap created", {
      orderId,
      tokens: pkg.tokens,
      priceIdr: pkg.priceIdr,
    });

    return {
      ok: true,
      token: snap.token,
      redirectUrl: snap.redirect_url,
      orderId,
    };
  } catch (err) {
    logger.error("[midtrans] Topup Snap creation failed", {
      error: err instanceof Error ? err.message : String(err),
      orderId,
    });

    await db
      .from("payment_intents")
      .update({ status: "failed" })
      .eq("id", intent.id);

    return {
      ok: false,
      code: "midtrans_error",
      message: err instanceof Error ? err.message : "Failed to create payment",
    };
  }
}
