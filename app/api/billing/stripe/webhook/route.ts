import { NextRequest, NextResponse } from "next/server";
import { handleMidtransNotification } from "@/lib/midtrans/notification";
import type { MidtransNotificationPayload } from "@/lib/midtrans/client";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

/**
 * POST /api/billing/stripe/webhook
 * @deprecated Legacy endpoint. Midtrans notifications go to /api/billing/midtrans/notification.
 * This route is kept as a fallback — it now proxies to the Midtrans handler.
 *
 * NOTE: This route intentionally skips withErrorHandler.
 */
export async function POST(req: NextRequest) {
  let payload: MidtransNotificationPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // If it looks like a Midtrans notification, process it
  if (payload.order_id && payload.signature_key) {
    try {
      const result = await handleMidtransNotification(payload);
      logger.info("[webhook-compat] Midtrans notification processed via legacy route", {
        orderId: payload.order_id,
        result: result.status,
      });
      return NextResponse.json({ received: true, ...result });
    } catch (err) {
      logger.error("[webhook-compat] Processing error", {
        error: err instanceof Error ? err.message : String(err),
        orderId: payload.order_id,
      });
      return NextResponse.json({ received: true, error: "processing_error" });
    }
  }

  // Unknown payload format
  logger.warn("[webhook-compat] Unknown webhook payload format");
  return NextResponse.json({ received: true, message: "unrecognized_format" });
}
