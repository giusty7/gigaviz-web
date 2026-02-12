import { NextResponse } from "next/server";
import { z } from "zod";
import { updateWorkerHeartbeat } from "@/lib/ops/health";
import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const heartbeatSchema = z.object({
  workerName: z.string().min(1).max(200),
  workerType: z.string().min(1).max(100),
  status: z.string().max(50).optional(),
  lastRunAt: z.string().datetime().optional(),
  nextRunAt: z.string().datetime().optional(),
  errorCount: z.number().int().min(0).optional(),
  lastError: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

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
    const parsed = heartbeatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { workerName, workerType, status, lastRunAt, nextRunAt, errorCount, lastError, metadata } = parsed.data;

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
