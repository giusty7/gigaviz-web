import { NextResponse } from "next/server";
import { updateWorkerHeartbeat } from "@/lib/ops/health";
import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

/**
 * POST /api/ops/health/heartbeat
 * Record worker heartbeat
 * Protected by CRON_SECRET
 */
export const POST = withErrorHandler(async (request: Request) => {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== serverEnv.CRON_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workerName, workerType, status, lastRunAt, nextRunAt, errorCount, lastError, metadata } = body;

    if (!workerName || !workerType) {
      return NextResponse.json({ error: "worker_name_and_type_required" }, { status: 400 });
    }

    const heartbeatId = await updateWorkerHeartbeat({
      workerName,
      workerType,
      status,
      lastRunAt,
      nextRunAt,
      errorCount,
      lastError,
      metadata,
    });

    return NextResponse.json({ success: true, heartbeatId });
  } catch (err) {
    logger.error("[ops] Worker heartbeat error:", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
});
