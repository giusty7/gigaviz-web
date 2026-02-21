import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { createXenditSubscriptionInvoice } from "@/lib/xendit/invoice";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const subscribeSchema = z.object({
  planCode: z.enum(["starter", "growth", "business"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
  currency: z.enum(["idr", "usd", "sgd"]).default("idr"),
});

/**
 * POST /api/billing/xendit/subscribe
 *
 * Creates a Xendit Invoice for a subscription plan payment.
 * Returns an invoice URL for the hosted checkout page.
 *
 * Multi-currency: IDR (Indonesian), USD (International), SGD (Singapore).
 *
 * Supported payment methods (via Xendit):
 * - Credit/debit cards (Visa, Mastercard, Amex, JCB)
 * - Bank transfer / VA (BCA, BNI, BRI, Mandiri, Permata, CIMB)
 * - E-wallets (OVO, DANA, ShopeePay, LinkAja, GoPay)
 * - QRIS
 * - Retail outlets (Alfamart, Indomaret)
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAppContext();
  if (!ctx.user || !ctx.currentWorkspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { planCode, interval, currency } = parsed.data;
  const wsSlug = ctx.currentWorkspace.slug;

  const result = await createXenditSubscriptionInvoice({
    workspaceId: ctx.currentWorkspace.id,
    workspaceSlug: wsSlug,
    planCode,
    interval,
    currency,
    customerEmail: ctx.user.email ?? "",
    customerName:
      ctx.profile?.full_name ?? ctx.user.email?.split("@")[0] ?? "Customer",
  });

  if (!result.ok) {
    logger.warn("[xendit-subscribe] Failed", {
      code: result.code,
      workspace: ctx.currentWorkspace.id,
    });
    return NextResponse.json(
      { error: result.code, message: result.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    invoiceId: result.invoiceId,
    invoiceUrl: result.invoiceUrl,
    orderId: result.orderId,
  });
});
