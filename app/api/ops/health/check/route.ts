import { NextResponse } from "next/server";
import { runAllHealthChecks, getStaleWorkers } from "@/lib/ops/health";
import { listTickets } from "@/lib/ops/tickets";
import { logger } from "@/lib/logging";
import { alertHealthDegraded, alertWorkerStale, alertTicketSlaBreach } from "@/lib/ops/alerts";
import { withErrorHandler } from "@/lib/api/with-error-handler";

/**
 * GET /api/ops/health/check
 * Run health checks and return results
 * Public endpoint for monitoring systems
 */
export const GET = withErrorHandler(async () => {
  try {
    const [results, staleWorkers, overdueTickets] = await Promise.all([
      runAllHealthChecks(),
      getStaleWorkers().catch(() => []),
      listTickets({ overdue: true, limit: 10 }).catch(() => []),
    ]);

    const statusCode = results.overall === "healthy" ? 200 : results.overall === "degraded" ? 200 : 503;

    // Alert if not healthy
    if (results.overall !== "healthy") {
      const failedChecks = Object.entries(results)
        .filter(([k, v]) => k !== "overall" && typeof v === "object" && v && "status" in v && v.status !== "healthy")
        .map(([k]) => k);
      alertHealthDegraded({ status: results.overall, failedChecks }).catch(() => {});
    }

    // Alert for stale workers
    for (const worker of staleWorkers) {
      alertWorkerStale({
        workerName: worker.workerName,
        lastSeen: worker.lastHeartbeat,
        threshold: "10 minutes",
      }).catch(() => {});
    }

    // Alert for overdue tickets (SLA breach)
    for (const ticket of overdueTickets) {
      const elapsedHours = ticket.dueAt
        ? Math.round((Date.now() - new Date(ticket.dueAt).getTime()) / 3600000 * 10) / 10
        : 0;
      alertTicketSlaBreach({
        ticketId: ticket.ticketNumber ?? ticket.id,
        subject: ticket.subject,
        slaType: `${ticket.priority} priority`,
        elapsedHours,
      }).catch(() => {});
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
});
