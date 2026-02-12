import "server-only";

import { getStripe } from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

type CheckoutOptions = {
  workspaceId: string;
  userId: string;
  /** Token amount to purchase */
  tokens: number;
  /** Amount in IDR (smallest unit = integer) */
  amountIdr: number;
  /** Return URL after success */
  successUrl: string;
  /** Return URL after cancel */
  cancelUrl: string;
};

type CheckoutResult =
  | { ok: true; url: string; sessionId: string; paymentIntentId: string }
  | { ok: false; code: string; message: string };

/**
 * Create a Stripe Checkout Session for token top-up.
 * Stores a payment_intent row so the webhook can settle tokens.
 */
export async function createCheckoutSession(opts: CheckoutOptions): Promise<CheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, code: "stripe_not_configured", message: "Stripe is not configured" };
  }

  const db = supabaseAdmin();

  // 1. Create local payment intent record
  const { data: intent, error: intentError } = await db
    .from("payment_intents")
    .insert({
      workspace_id: opts.workspaceId,
      provider: "stripe",
      amount_idr: opts.amountIdr,
      status: "pending",
      meta: {
        tokens: opts.tokens,
        created_by: opts.userId,
      },
    })
    .select("id")
    .single();

  if (intentError || !intent) {
    logger.error("[stripe] Failed to create payment intent", { error: intentError?.message });
    return { ok: false, code: "db_error", message: "Failed to create payment record" };
  }

  try {
    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "idr",
            product_data: {
              name: `Gigaviz Token Top-up (${opts.tokens} tokens)`,
              description: `Top-up ${opts.tokens} tokens for your Gigaviz workspace`,
            },
            unit_amount: opts.amountIdr, // Already in smallest unit for IDR
          },
          quantity: 1,
        },
      ],
      metadata: {
        payment_intent_id: intent.id,
        workspace_id: opts.workspaceId,
        tokens: String(opts.tokens),
      },
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
    });

    // 3. Update local record with Stripe session/payment intent
    await db
      .from("payment_intents")
      .update({
        provider_ref: session.id,
        meta: {
          tokens: opts.tokens,
          created_by: opts.userId,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
        },
      })
      .eq("id", intent.id);

    return {
      ok: true,
      url: session.url ?? opts.successUrl,
      sessionId: session.id,
      paymentIntentId: intent.id,
    };
  } catch (err) {
    logger.error("[stripe] Checkout session creation failed", {
      error: err instanceof Error ? err.message : String(err),
    });

    // Mark intent as failed
    await db
      .from("payment_intents")
      .update({ status: "failed" })
      .eq("id", intent.id);

    return {
      ok: false,
      code: "stripe_error",
      message: err instanceof Error ? err.message : "Checkout session creation failed",
    };
  }
}
