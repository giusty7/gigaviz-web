import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { createTokenTopupSnap } from "@/lib/midtrans/snap";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  packageId: z.enum(["pkg_50k", "pkg_100k", "pkg_500k"]),
});

/**
 * POST /api/billing/stripe/checkout
 * @deprecated Use /api/billing/midtrans/topup instead.
 * Kept for backward compatibility — proxies to Midtrans.
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

  const { packageId } = parsed.data;
  const wsSlug = ctx.currentWorkspace.slug;

  const result = await createTokenTopupSnap({
    workspaceId: ctx.currentWorkspace.id,
    workspaceSlug: wsSlug,
    packageId,
    customerEmail: ctx.user.email ?? "",
    customerName:
      ctx.profile?.full_name ?? ctx.user.email?.split("@")[0] ?? "Customer",
  });

  if (!result.ok) {
    logger.warn("[checkout-compat] Failed", {
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
    url: result.redirectUrl,
    redirectUrl: result.redirectUrl,
    orderId: result.orderId,
  });
});
