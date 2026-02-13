import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { createSubscriptionSnap } from "@/lib/midtrans/snap";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const subscribeSchema = z.object({
  planCode: z.enum(["starter", "growth", "business"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

/**
 * POST /api/billing/midtrans/subscribe
 *
 * Creates a Midtrans Snap transaction for a subscription plan payment.
 * Returns a Snap token and redirect URL for the payment popup.
 *
 * Supported payment methods (all handled by Midtrans Snap):
 * - Credit/debit cards (Visa, Mastercard, JCB)
 * - Bank transfer (BCA, BNI, BRI, Mandiri, Permata)
 * - E-wallets (GoPay, ShopeePay, DANA, OVO, LinkAja)
 * - QRIS
 * - Convenience stores (Alfamart, Indomaret)
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

  const { planCode, interval } = parsed.data;
  const wsSlug = ctx.currentWorkspace.slug;

  const result = await createSubscriptionSnap({
    workspaceId: ctx.currentWorkspace.id,
    workspaceSlug: wsSlug,
    planCode,
    interval,
    customerEmail: ctx.user.email ?? "",
    customerName:
      ctx.profile?.full_name ?? ctx.user.email?.split("@")[0] ?? "Customer",
  });

  if (!result.ok) {
    logger.warn("[midtrans-subscribe] Failed", {
      code: result.code,
      workspace: ctx.currentWorkspace.id,
    });
    return NextResponse.json(
      { error: result.code, message: result.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token: result.token,
    redirectUrl: result.redirectUrl,
    orderId: result.orderId,
  });
});
