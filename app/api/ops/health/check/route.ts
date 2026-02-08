import { NextResponse } from "next/server";
import { runAllHealthChecks } from "@/lib/ops/health";
import { logger } from "@/lib/logging";
import { alertHealthDegraded } from "@/lib/ops/alerts";

/**
 * GET /api/ops/health/check
 * Run health checks and return results
 * Public endpoint for monitoring systems
 */
export async function GET() {
  try {
    const results = await runAllHealthChecks();

    const statusCode = results.overall === "healthy" ? 200 : results.overall === "degraded" ? 200 : 503;

    // Alert if not healthy
    if (results.overall !== "healthy") {
      const failedChecks = Object.entries(results)
        .filter(([k, v]) => k !== "overall" && typeof v === "object" && v && "status" in v && v.status !== "healthy")
        .map(([k]) => k);
      alertHealthDegraded({ status: results.overall, failedChecks }).catch(() => {});
    }

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
