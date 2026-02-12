import "server-only";

import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let _stripe: Stripe | null = null;

/**
 * Singleton Stripe client.
 * Returns null if STRIPE_SECRET_KEY is not configured.
 */
export function getStripe(): Stripe | null {
  if (!serverEnv.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Verify a Stripe webhook signature.
 * Returns the parsed event on success, null on failure.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const stripe = getStripe();
  if (!stripe || !serverEnv.STRIPE_WEBHOOK_SECRET) return null;

  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return null;
  }
}
