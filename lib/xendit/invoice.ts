import "server-only";

/* ------------------------------------------------------------------ */
/* Xendit Invoice — high-level helpers for subscriptions & top-ups    */
/*                                                                     */
/* Architecture note:                                                  */
/* Uses Xendit Invoice API for hosted checkout pages.                  */
/* Multi-currency support: IDR (local) + USD/SGD (international).     */
/* Same pattern as Midtrans Snap helpers — provider-agnostic at       */
/* the settlement layer.                                               */
/* ------------------------------------------------------------------ */

import { createInvoice } from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/* ── Plan pricing (multi-currency) ───────────────────────────────── */

export const XENDIT_PLAN_PRICES: Record<
  string,
  Record<"idr" | "usd" | "sgd", { monthly: number; yearly: number }> & { name: string }
> = {
  starter: {
    name: "Starter",
    idr: { monthly: 149_000, yearly: 1_428_000 },
    usd: { monthly: 10, yearly: 96 },           // $10/mo, $96/yr (20% off)
    sgd: { monthly: 13, yearly: 125 },           // S$13/mo, S$125/yr
  },
  growth: {
    name: "Growth",
    idr: { monthly: 399_000, yearly: 3_828_000 },
    usd: { monthly: 25, yearly: 240 },           // $25/mo, $240/yr
    sgd: { monthly: 33, yearly: 317 },           // S$33/mo, S$317/yr
  },
  business: {
    name: "Business",
    idr: { monthly: 899_000, yearly: 8_628_000 },
    usd: { monthly: 60, yearly: 576 },           // $60/mo, $576/yr
    sgd: { monthly: 79, yearly: 758 },           // S$79/mo, S$758/yr
  },
};

/* ── Token top-up packages (multi-currency) ──────────────────────── */

export const XENDIT_TOKEN_PACKAGES: Record<
  string,
  Record<"idr" | "usd" | "sgd", number> & { tokens: number; label: string }
> = {
  pkg_50k: {
    tokens: 50_000,
    label: "50,000 Tokens",
    idr: 50_000,
    usd: 3,     // $3
    sgd: 4,     // S$4
  },
  pkg_100k: {
    tokens: 105_000,
    label: "100,000 + Bonus",
    idr: 100_000,
    usd: 6,     // $6
    sgd: 8,     // S$8
  },
  pkg_500k: {
    tokens: 550_000,
    label: "500,000 + Bonus",
    idr: 500_000,
    usd: 25,    // $25
    sgd: 33,    // S$33
  },
};

/* ── Types ────────────────────────────────────────────────────────── */

export type XenditSubscriptionOptions = {
  workspaceId: string;
  workspaceSlug: string;
  planCode: string;
  interval: "monthly" | "yearly";
  currency: "idr" | "usd" | "sgd";
  customerEmail: string;
  customerName: string;
  isRenewal?: boolean;
};

export type XenditTopupOptions = {
  workspaceId: string;
  workspaceSlug: string;
  packageId: string;
  currency: "idr" | "usd" | "sgd";
  customerEmail: string;
  customerName: string;
};

type InvoiceResult =
  | { ok: true; invoiceId: string; invoiceUrl: string; orderId: string }
  | { ok: false; code: string; message: string };

/* ── Subscription Invoice ────────────────────────────────────────── */

export async function createXenditSubscriptionInvoice(
  opts: XenditSubscriptionOptions
): Promise<InvoiceResult> {
  const pricing = XENDIT_PLAN_PRICES[opts.planCode];
  if (!pricing) {
    return { ok: false, code: "invalid_plan", message: `Unknown plan: ${opts.planCode}` };
  }

  const currencyPricing = pricing[opts.currency];
  const amount =
    opts.interval === "yearly" ? currencyPricing.yearly : currencyPricing.monthly;
  const intervalLabel = opts.interval === "yearly" ? "Annual" : "Monthly";
  const renewTag = opts.isRenewal ? "RNW" : "NEW";
  const orderId = `XND-SUB-${opts.planCode.toUpperCase()}-${renewTag}-${opts.workspaceId.slice(0, 8)}-${Date.now()}`;

  const db = supabaseAdmin();

  // 1. Store payment intent
  const { data: intent, error: insertErr } = await db
    .from("payment_intents")
    .insert({
      workspace_id: opts.workspaceId,
      kind: "subscription",
      amount_idr: opts.currency === "idr" ? amount : 0,
      status: "pending",
      provider: "xendit",
      provider_ref: orderId,
      meta: {
        plan_code: opts.planCode,
        interval: opts.interval,
        currency: opts.currency,
        amount_original: amount,
        is_renewal: opts.isRenewal ?? false,
      },
    })
    .select("id")
    .single();

  if (insertErr || !intent) {
    logger.error("[xendit] Failed to create payment intent", {
      error: insertErr?.message,
      orderId,
    });
    return { ok: false, code: "db_error", message: "Failed to create payment record" };
  }

  try {
    // 2. Create Xendit Invoice
    const invoice = await createInvoice({
      external_id: orderId,
      amount,
      currency: opts.currency.toUpperCase() as "IDR" | "USD" | "SGD",
      payer_email: opts.customerEmail,
      description: `Gigaviz ${pricing.name} Plan (${intervalLabel})`,
      invoice_duration: 86400, // 24 hours
      success_redirect_url: `${APP_URL}/${opts.workspaceSlug}/settings/billing?payment=success&plan=${opts.planCode}&provider=xendit`,
      failure_redirect_url: `${APP_URL}/${opts.workspaceSlug}/settings/billing?payment=error`,
      items: [
        {
          name: `Gigaviz ${pricing.name} Plan (${intervalLabel})`,
          quantity: 1,
          price: amount,
          category: "subscription",
        },
      ],
      customer: {
        given_names: opts.customerName,
        email: opts.customerEmail,
      },
      metadata: {
        workspace_id: opts.workspaceId,
        plan_code: opts.planCode,
        interval: opts.interval,
        is_renewal: String(opts.isRenewal ?? false),
        payment_intent_id: intent.id,
        kind: "subscription",
      },
    });

    // 3. Store invoice URL + ID
    await db
      .from("payment_intents")
      .update({
        checkout_url: invoice.invoice_url,
        meta: {
          plan_code: opts.planCode,
          interval: opts.interval,
          currency: opts.currency,
          amount_original: amount,
          is_renewal: opts.isRenewal ?? false,
          xendit_invoice_id: invoice.id,
        },
      })
      .eq("id", intent.id);

    logger.info("[xendit] Subscription invoice created", {
      orderId,
      planCode: opts.planCode,
      amount,
      currency: opts.currency,
      interval: opts.interval,
      invoiceId: invoice.id,
    });

    return {
      ok: true,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      orderId,
    };
  } catch (err) {
    logger.error("[xendit] Invoice creation failed", {
      error: err instanceof Error ? err.message : String(err),
      orderId,
    });

    await db
      .from("payment_intents")
      .update({ status: "failed" })
      .eq("id", intent.id);

    return {
      ok: false,
      code: "xendit_error",
      message: err instanceof Error ? err.message : "Failed to create invoice",
    };
  }
}

/* ── Token Top-up Invoice ────────────────────────────────────────── */

export async function createXenditTokenTopupInvoice(
  opts: XenditTopupOptions
): Promise<InvoiceResult> {
  const pkg = XENDIT_TOKEN_PACKAGES[opts.packageId];
  if (!pkg) {
    return { ok: false, code: "invalid_package", message: `Unknown package: ${opts.packageId}` };
  }

  const amount = pkg[opts.currency];
  const orderId = `XND-TOPUP-${opts.workspaceId.slice(0, 8)}-${Date.now()}`;
  const db = supabaseAdmin();

  // 1. Store payment intent
  const { data: intent, error: insertErr } = await db
    .from("payment_intents")
    .insert({
      workspace_id: opts.workspaceId,
      kind: "topup",
      amount_idr: opts.currency === "idr" ? amount : 0,
      status: "pending",
      provider: "xendit",
      provider_ref: orderId,
      meta: {
        type: "token_topup",
        token_amount: pkg.tokens,
        package_id: opts.packageId,
        currency: opts.currency,
        amount_original: amount,
      },
    })
    .select("id")
    .single();

  if (insertErr || !intent) {
    logger.error("[xendit] Failed to create topup intent", {
      error: insertErr?.message,
      orderId,
    });
    return { ok: false, code: "db_error", message: "Failed to create payment record" };
  }

  try {
    // 2. Create Xendit Invoice
    const invoice = await createInvoice({
      external_id: orderId,
      amount,
      currency: opts.currency.toUpperCase() as "IDR" | "USD" | "SGD",
      payer_email: opts.customerEmail,
      description: `${pkg.tokens.toLocaleString("en-US")} AI Tokens`,
      invoice_duration: 86400, // 24 hours
      success_redirect_url: `${APP_URL}/${opts.workspaceSlug}/settings/billing?topup=success&provider=xendit`,
      failure_redirect_url: `${APP_URL}/${opts.workspaceSlug}/settings/billing?topup=error`,
      items: [
        {
          name: `${pkg.tokens.toLocaleString("en-US")} AI Tokens`,
          quantity: 1,
          price: amount,
          category: "token_topup",
        },
      ],
      customer: {
        given_names: opts.customerName,
        email: opts.customerEmail,
      },
      metadata: {
        workspace_id: opts.workspaceId,
        package_id: opts.packageId,
        token_amount: String(pkg.tokens),
        payment_intent_id: intent.id,
        kind: "topup",
      },
    });

    // 3. Update with invoice URL
    await db
      .from("payment_intents")
      .update({
        checkout_url: invoice.invoice_url,
        meta: {
          type: "token_topup",
          token_amount: pkg.tokens,
          package_id: opts.packageId,
          currency: opts.currency,
          amount_original: amount,
          xendit_invoice_id: invoice.id,
        },
      })
      .eq("id", intent.id);

    logger.info("[xendit] Topup invoice created", {
      orderId,
      tokens: pkg.tokens,
      amount,
      currency: opts.currency,
      invoiceId: invoice.id,
    });

    return {
      ok: true,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      orderId,
    };
  } catch (err) {
    logger.error("[xendit] Topup invoice creation failed", {
      error: err instanceof Error ? err.message : String(err),
      orderId,
    });

    await db
      .from("payment_intents")
      .update({ status: "failed" })
      .eq("id", intent.id);

    return {
      ok: false,
      code: "xendit_error",
      message: err instanceof Error ? err.message : "Failed to create invoice",
    };
  }
}
