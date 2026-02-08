import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { getHealthSummary } from "@/lib/ops/health";
import { logger } from "@/lib/logging";

/**
 * GET /api/ops/health
 * Get system health summary
 */
export async function GET() {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const summary = await getHealthSummary();

    return NextResponse.json(summary);
  } catch (err) {
    logger.error("[ops] Get health summary error", { error: err instanceof Error ? err.message : String(err) });

    // Map Supabase P0001 unauthorized to 403
    const status = (err as { code?: string })?.code === "P0001" ? 403 : 500;

    return NextResponse.json(
      { error: "internal_error" },
      { status }
    );
  }
}
