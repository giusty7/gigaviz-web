import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { executeSqlQuery, getSqlQueryHistory } from "@/lib/ops/sql-runner";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const sqlQuerySchema = z.object({
  query: z.string().min(1, "query_required").max(10000, "query_too_long"),
});

/**
 * GET /api/ops/sql-query
 * Get SQL query history
 */
export const GET = withErrorHandler(async () => {
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
});

/**
 * POST /api/ops/sql-query
 * Execute read-only SQL query
 */
export const POST = withErrorHandler(async (request: Request) => {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const body = await request.json();
    const { query } = sqlQuerySchema.parse(body);

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
});
