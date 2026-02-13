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
 * POST /api/billing/stripe/subscribe
 * @deprecated Use /api/billing/midtrans/subscribe instead.
 * Kept for backward compatibility — proxies to Midtrans.
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
    logger.warn("[subscribe-compat] Failed", {
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
    url: result.redirectUrl,
    orderId: result.orderId,
  });
});
