import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { executeSqlQuery, getSqlQueryHistory } from "@/lib/ops/sql-runner";
import { logger } from "@/lib/logging";

/**
 * GET /api/ops/sql-query
 * Get SQL query history
 */
export async function GET() {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const history = await getSqlQueryHistory(ctx.user.id, 50);

    return NextResponse.json({ history });
  } catch (err) {
    logger.error("[ops] sql-query GET error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ops/sql-query
 * Execute read-only SQL query
 */
export async function POST(request: Request) {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "query_required" }, { status: 400 });
    }

    const result = await executeSqlQuery({
      query,
      adminId: ctx.user.id,
      adminEmail: ctx.actorEmail ?? ctx.user.email ?? "unknown",
    });

    if (result.error) {
      return NextResponse.json(
        {
          rows: [],
          rowCount: 0,
          executionTimeMs: result.executionTimeMs,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    logger.error("[ops] sql-query POST error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
