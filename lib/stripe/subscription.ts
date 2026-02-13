/* eslint-disable @typescript-eslint/no-explicit-any */
// DEPRECATED: This file is no longer imported. Midtrans is used instead.
// Kept for reference only. Will be removed in a future cleanup pass.

import "server-only";

import { getStripe } from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

/* ------------------------------------------------------------------ */
/* Stripe Price IDs — must be created in the Stripe Dashboard first.  */
/* We fall back to env vars so each environment (test / live) can      */
/* configure its own prices.                                          */
/* ------------------------------------------------------------------ */

export const STRIPE_PRICES: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "",
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY ?? "",
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY ?? "",
  },
};

/* ------------------------------------------------------------------ */
/* Create or retrieve a Stripe Customer for a workspace               */
/* ------------------------------------------------------------------ */

export async function getOrCreateStripeCustomer(opts: {
  workspaceId: string;
  workspaceName: string;
  email: string;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const db = supabaseAdmin();

  // Check if workspace already has a Stripe customer ID
  const { data: sub } = await db
    .from("subscriptions")
    .select("provider_ref, provider")
    .eq("workspace_id", opts.workspaceId)
    .eq("provider", "stripe")
    .maybeSingle();

  if (sub?.provider_ref?.startsWith("cus_")) {
    return sub.provider_ref;
  }

  // Check metadata on workspace
  const { data: workspace } = await db
    .from("workspaces")
    .select("meta")
    .eq("id", opts.workspaceId)
    .maybeSingle();

  const existingCustomerId = (workspace?.meta as Record<string, unknown>)?.stripe_customer_id;
  if (typeof existingCustomerId === "string" && existingCustomerId.startsWith("cus_")) {
    return existingCustomerId;
  }

  // Create new Stripe customer
  try {
    const customer = await stripe.customers.create({
      email: opts.email,
      name: opts.workspaceName,
      metadata: {
        workspace_id: opts.workspaceId,
        platform: "gigaviz",
      },
    });

    // Store customer ID in workspace metadata
    const currentMeta = (workspace?.meta as Record<string, unknown>) ?? {};
    await db
      .from("workspaces")
      .update({
        meta: { ...currentMeta, stripe_customer_id: customer.id },
      })
      .eq("id", opts.workspaceId);

    logger.info("[stripe] Customer created", {
      customerId: customer.id,
      workspace: opts.workspaceId,
    });

    return customer.id;
  } catch (err) {
    logger.error("[stripe] Failed to create customer", {
      error: err instanceof Error ? err.message : String(err),
      workspace: opts.workspaceId,
    });
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Create a Stripe Checkout Session for subscription                   */
/* ------------------------------------------------------------------ */

type SubscribeOptions = {
  workspaceId: string;
  workspaceName: string;
  userId: string;
  email: string;
  planCode: string;
  interval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
};

type SubscribeResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; code: string; message: string };

export async function createSubscriptionCheckout(
  opts: SubscribeOptions
): Promise<SubscribeResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, code: "stripe_not_configured", message: "Stripe is not configured" };
  }

  const priceConfig = STRIPE_PRICES[opts.planCode];
  if (!priceConfig) {
    return { ok: false, code: "invalid_plan", message: `Unknown plan: ${opts.planCode}` };
  }

  const priceId = opts.interval === "yearly" ? priceConfig.yearly : priceConfig.monthly;
  if (!priceId) {
    return {
      ok: false,
      code: "price_not_configured",
      message: `Stripe price not configured for ${opts.planCode} ${opts.interval}`,
    };
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer({
    workspaceId: opts.workspaceId,
    workspaceName: opts.workspaceName,
    email: opts.email,
  });

  if (!customerId) {
    return { ok: false, code: "customer_creation_failed", message: "Failed to create Stripe customer" };
  }

  try {
    const sessionParams: any = {
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        workspace_id: opts.workspaceId,
        user_id: opts.userId,
        plan_code: opts.planCode,
        interval: opts.interval,
      },
      subscription_data: {
        metadata: {
          workspace_id: opts.workspaceId,
          plan_code: opts.planCode,
        },
      },
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      allow_promotion_codes: true,
    };

    // Add trial if specified
    if (opts.trialDays && opts.trialDays > 0) {
      sessionParams.subscription_data!.trial_period_days = opts.trialDays;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logger.info("[stripe] Subscription checkout created", {
      sessionId: session.id,
      workspace: opts.workspaceId,
      plan: opts.planCode,
      interval: opts.interval,
      trial: opts.trialDays ?? 0,
    });

    return {
      ok: true,
      url: session.url ?? opts.successUrl,
      sessionId: session.id,
    };
  } catch (err) {
    logger.error("[stripe] Subscription checkout failed", {
      error: err instanceof Error ? err.message : String(err),
      workspace: opts.workspaceId,
    });
    return {
      ok: false,
      code: "checkout_creation_failed",
      message: "Failed to create checkout session",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Create a Stripe Customer Portal session                             */
/* ------------------------------------------------------------------ */

export async function createPortalSession(opts: {
  workspaceId: string;
  workspaceName: string;
  email: string;
  returnUrl: string;
}): Promise<{ ok: true; url: string } | { ok: false; code: string; message: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, code: "stripe_not_configured", message: "Stripe is not configured" };
  }

  const customerId = await getOrCreateStripeCustomer({
    workspaceId: opts.workspaceId,
    workspaceName: opts.workspaceName,
    email: opts.email,
  });

  if (!customerId) {
    return { ok: false, code: "customer_not_found", message: "Stripe customer not found" };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: opts.returnUrl,
    });

    return { ok: true, url: session.url };
  } catch (err) {
    logger.error("[stripe] Portal session failed", {
      error: err instanceof Error ? err.message : String(err),
      workspace: opts.workspaceId,
    });
    return { ok: false, code: "portal_error", message: "Failed to create portal session" };
  }
}

/* ------------------------------------------------------------------ */
/* Handle subscription lifecycle from Stripe webhooks                  */
/* ------------------------------------------------------------------ */

export async function handleSubscriptionCreated(subscription: {
  id: string;
  customer: string;
  status: string;
  metadata: Record<string, string>;
  current_period_start: number;
  current_period_end: number;
  trial_start?: number | null;
  trial_end?: number | null;
  items: { data: Array<{ price: { id: string } }> };
}) {
  const db = supabaseAdmin();
  const workspaceId = subscription.metadata?.workspace_id;
  const planCode = subscription.metadata?.plan_code;

  if (!workspaceId || !planCode) {
    logger.warn("[stripe] Subscription missing workspace/plan metadata", {
      subscriptionId: subscription.id,
    });
    return;
  }

  const status = mapStripeStatus(subscription.status);
  const now = new Date().toISOString();

  await db
    .from("subscriptions")
    .upsert(
      {
        workspace_id: workspaceId,
        plan_id: planCode,
        plan_code: planCode,
        status,
        provider: "stripe",
        provider_ref: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        billing_mode: "team",
        seat_limit: getSeatLimit(planCode),
        updated_at: now,
      },
      { onConflict: "workspace_id" }
    );

  logger.info("[stripe] Subscription activated", {
    subscriptionId: subscription.id,
    workspace: workspaceId,
    plan: planCode,
    status,
  });
}

export async function handleSubscriptionUpdated(subscription: {
  id: string;
  status: string;
  metadata: Record<string, string>;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end?: boolean;
}) {
  const db = supabaseAdmin();
  const workspaceId = subscription.metadata?.workspace_id;

  if (!workspaceId) {
    logger.warn("[stripe] Subscription update missing workspace", {
      subscriptionId: subscription.id,
    });
    return;
  }

  const status = subscription.cancel_at_period_end
    ? "canceled"
    : mapStripeStatus(subscription.status);

  await db
    .from("subscriptions")
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("provider", "stripe");

  logger.info("[stripe] Subscription updated", {
    subscriptionId: subscription.id,
    workspace: workspaceId,
    status,
  });
}

export async function handleSubscriptionDeleted(subscription: {
  id: string;
  metadata: Record<string, string>;
}) {
  const db = supabaseAdmin();
  const workspaceId = subscription.metadata?.workspace_id;

  if (!workspaceId) return;

  // Downgrade to free plan
  await db
    .from("subscriptions")
    .update({
      plan_id: "free",
      plan_code: "free",
      status: "canceled",
      provider: "stripe",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("provider", "stripe");

  logger.info("[stripe] Subscription deleted → downgraded to free", {
    subscriptionId: subscription.id,
    workspace: workspaceId,
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function mapStripeStatus(status: string): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "past_due";
    default:
      return "active";
  }
}

function getSeatLimit(planCode: string): number {
  switch (planCode) {
    case "starter":
      return 3;
    case "growth":
      return 10;
    case "business":
      return 25;
    default:
      return 1;
  }
}
