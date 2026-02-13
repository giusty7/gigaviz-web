import { NextRequest, NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-context";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

/**
 * POST /api/billing/stripe/portal
 * @deprecated Stripe is not available. Redirects to in-app billing page.
 * Kept for backward compatibility.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAppContext();
  if (!ctx.user || !ctx.currentWorkspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = req.headers.get("origin") || "https://gigaviz.com";
  const wsSlug = ctx.currentWorkspace.slug;

  // Midtrans doesn't have a customer portal equivalent.
  // Redirect users to the in-app billing management page.
  return NextResponse.json({
    url: `${origin}/${wsSlug}/settings/billing`,
  });
});
