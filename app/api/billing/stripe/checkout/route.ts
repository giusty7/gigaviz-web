import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  tokens: z.number().int().min(100).max(10_000_000),
  amountIdr: z.number().int().min(1000),
});

/**
 * POST /api/billing/stripe/checkout
 * Creates a Stripe Checkout Session for token top-up.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAppContext();
  if (!ctx.user || !ctx.currentWorkspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tokens, amountIdr } = parsed.data;
  const origin = req.headers.get("origin") || "https://gigaviz.com";
  const wsSlug = ctx.currentWorkspace.slug;

  const result = await createCheckoutSession({
    workspaceId: ctx.currentWorkspace.id,
    userId: ctx.user.id,
    tokens,
    amountIdr,
    successUrl: `${origin}/${wsSlug}/billing?payment=success`,
    cancelUrl: `${origin}/${wsSlug}/billing?payment=cancelled`,
  });

  if (!result.ok) {
    logger.warn("[stripe-checkout] Failed", {
      code: result.code,
      workspace: ctx.currentWorkspace.id,
    });
    return NextResponse.json(
      { error: result.code, message: result.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: result.url,
    sessionId: result.sessionId,
    paymentIntentId: result.paymentIntentId,
  });
});
