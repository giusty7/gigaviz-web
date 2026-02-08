import { NextResponse } from "next/server";
import { runAllHealthChecks } from "@/lib/ops/health";
import { logger } from "@/lib/logging";

/**
 * GET /api/ops/health/check
 * Run health checks and return results
 * Public endpoint for monitoring systems
 */
export async function GET() {
  try {
    const results = await runAllHealthChecks();

    const statusCode = results.overall === "healthy" ? 200 : results.overall === "degraded" ? 200 : 503;

    return NextResponse.json(
      {
        status: results.overall,
        checks: results,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  } catch (err) {
    logger.error("[ops] Health check error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err instanceof Error ? err.message : "internal_error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
