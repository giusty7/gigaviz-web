import { NextRequest, NextResponse } from "next/server";
import { handleMidtransNotification } from "@/lib/midtrans/notification";
import type { MidtransNotificationPayload } from "@/lib/midtrans/client";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

/**
 * POST /api/billing/midtrans/notification
 *
 * Midtrans Payment Notification (webhook) endpoint.
 * Midtrans sends HTTP POST notifications for every payment status change.
 *
 * Configure this URL in Midtrans Dashboard → Settings → Payment Notification URL:
 *   https://yourdomain.com/api/billing/midtrans/notification
 *
 * NOTE: This route intentionally skips withErrorHandler because Midtrans
 * expects specific response codes and the body format is fixed.
 */
export async function POST(req: NextRequest) {
  let payload: MidtransNotificationPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload.order_id || !payload.signature_key || !payload.status_code) {
    logger.warn("[midtrans-webhook] Missing required fields", {
      hasOrderId: Boolean(payload.order_id),
      hasSignature: Boolean(payload.signature_key),
    });
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    const result = await handleMidtransNotification(payload);

    logger.info("[midtrans-webhook] Notification processed", {
      orderId: payload.order_id,
      txStatus: payload.transaction_status,
      result: result.status,
      action: result.action,
    });

    // Midtrans expects 200 OK to acknowledge receipt
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    logger.error("[midtrans-webhook] Processing error", {
      error: err instanceof Error ? err.message : String(err),
      orderId: payload.order_id,
    });

    // Return 200 even on processing errors to prevent Midtrans retries
    // (we already logged the error and can investigate)
    return NextResponse.json({ received: true, error: "processing_error" });
  }
}
