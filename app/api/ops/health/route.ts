import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { getHealthSummary } from "@/lib/ops/health";
import { withErrorHandler } from "@/lib/api/with-error-handler";

/**
 * GET /api/ops/health
 * Get system health summary
 */
export const GET = withErrorHandler(async () => {
  // Check ops enabled inline (avoids notFound() throw in API route context)
  const opsEnabled =
    process.env.OPS_ENABLED ?? (process.env.NODE_ENV === "development" ? "1" : undefined);
  if (opsEnabled !== "1") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ctx = await requirePlatformAdmin();
  if (!ctx.ok) {
    return NextResponse.json(
      { error: ctx.reason },
      { status: ctx.reason === "not_authenticated" ? 401 : 403 }
    );
  }

  const summary = await getHealthSummary();

  return NextResponse.json(summary);
});
