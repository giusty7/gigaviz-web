import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookToken } from "@/lib/xendit/client";
import { handleXenditWebhookEvent } from "@/lib/xendit/webhook";
import type { XenditWebhookPayload } from "@/lib/xendit/client";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

/**
 * POST /api/billing/xendit/webhook
 *
 * Xendit Invoice Webhook endpoint.
 * Xendit sends HTTP POST callbacks for every invoice status change
 * (PAID, EXPIRED, etc.).
 *
 * Configure this URL in Xendit Dashboard → Settings → Webhooks → Invoice Paid:
 *   https://yourdomain.com/api/billing/xendit/webhook
 *
 * NOTE: This route intentionally skips withErrorHandler because Xendit
 * expects a 200 OK to acknowledge receipt. We handle errors internally.
 *
 * Verification: Xendit sends a x-callback-token header that must match
 * the XENDIT_WEBHOOK_TOKEN configured in dashboard + .env.
 */
export async function POST(req: NextRequest) {
  // 1. Verify webhook authenticity via x-callback-token
  const callbackToken = req.headers.get("x-callback-token") ?? "";

  try {
    if (!verifyWebhookToken(callbackToken)) {
      logger.warn("[xendit-webhook] Invalid callback token");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } catch (err) {
    logger.error("[xendit-webhook] Token verification error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "config_error" }, { status: 500 });
  }

  // 2. Parse payload
  let payload: XenditWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload.id || !payload.external_id || !payload.status) {
    logger.warn("[xendit-webhook] Missing required fields", {
      hasId: Boolean(payload.id),
      hasExternalId: Boolean(payload.external_id),
      hasStatus: Boolean(payload.status),
    });
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // 3. Process the webhook event
  try {
    const result = await handleXenditWebhookEvent(payload);

    logger.info("[xendit-webhook] Notification processed", {
      invoiceId: payload.id,
      externalId: payload.external_id,
      status: payload.status,
      result: result.status,
      action: result.action,
    });

    // Xendit expects 200 OK to acknowledge receipt
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    logger.error("[xendit-webhook] Processing error", {
      error: err instanceof Error ? err.message : String(err),
      invoiceId: payload.id,
      externalId: payload.external_id,
    });

    // Return 200 even on processing errors to prevent Xendit retries
    // (we already logged the error and can investigate)
    return NextResponse.json({ received: true, error: "processing_error" });
  }
}
