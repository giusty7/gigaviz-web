import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe/client";
import { settlePaymentIntentPaid } from "@/lib/billing/topup";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

/**
 * POST /api/billing/stripe/webhook
 * Stripe webhook endpoint. Verifies signature and processes payment events.
 *
 * NOTE: This route intentionally skips withErrorHandler because Stripe
 * expects raw body access and specific response codes.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const event = verifyWebhookSignature(rawBody, signature);

  if (!event) {
    logger.warn("[stripe-webhook] Invalid signature");
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Store raw event for audit
  try {
    await db.from("payment_events").insert({
      provider: "stripe",
      provider_event_id: event.id,
      payload: event,
      received_at: new Date().toISOString(),
    });
  } catch { /* ignore duplicate */ }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const paymentIntentId = session.metadata?.payment_intent_id;
        const tokens = Number(session.metadata?.tokens ?? 0);

        if (!paymentIntentId) {
          logger.warn("[stripe-webhook] Missing payment_intent_id in metadata", {
            sessionId: session.id,
          });
          break;
        }

        const result = await settlePaymentIntentPaid(paymentIntentId, {
          provider: "stripe",
          meta: {
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            tokens,
          },
        });

        if (!result.ok) {
          logger.error("[stripe-webhook] Settlement failed", {
            code: result.code,
            paymentIntentId,
          });
        } else {
          logger.info("[stripe-webhook] Payment settled", {
            paymentIntentId,
            tokens: result.tokens,
            status: result.status,
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const paymentIntentId = session.metadata?.payment_intent_id;
        if (paymentIntentId) {
          await db
            .from("payment_intents")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("id", paymentIntentId)
            .eq("status", "pending");
          logger.info("[stripe-webhook] Session expired", { paymentIntentId });
        }
        break;
      }

      default:
        logger.info("[stripe-webhook] Unhandled event type", { type: event.type });
    }
  } catch (err) {
    logger.error("[stripe-webhook] Processing error", {
      error: err instanceof Error ? err.message : String(err),
      eventType: event.type,
    });
    // Still return 200 to prevent Stripe retries for processing errors
  }

  return NextResponse.json({ received: true });
}
