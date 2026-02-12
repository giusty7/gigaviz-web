import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import {
  getAnalyticsSummary,
  getMetricsSnapshots,
  generateDailySnapshot,
} from "@/lib/ops/analytics";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "summary";

    if (action === "summary") {
      const summary = await getAnalyticsSummary();
      return NextResponse.json(summary);
    }

    if (action === "snapshots") {
      const periodType = searchParams.get("period") as
        | "daily"
        | "weekly"
        | "monthly"
        | undefined;
      const startDate = searchParams.get("start") || undefined;
      const endDate = searchParams.get("end") || undefined;
      const limit = searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 30;

      const snapshots = await getMetricsSnapshots({
        periodType,
        startDate,
        endDate,
        limit,
      });
      return NextResponse.json({ snapshots });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("[ops] analytics error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const body = await request.json();
    const { action, targetDate } = body;

    if (action === "generate_snapshot") {
      const snapshotId = await generateDailySnapshot(targetDate);
      return NextResponse.json({ success: true, snapshot_id: snapshotId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("[ops] analytics error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
