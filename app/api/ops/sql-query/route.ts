import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { executeSqlQuery, getSqlQueryHistory } from "@/lib/ops/sql-runner";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const sqlQuerySchema = z.object({
  query: z.string().min(1, "query_required").max(10000, "query_too_long"),
});

/** Inline ops-enabled check (avoids notFound() throw in API route context) */
function isOpsEnabled() {
  const v = process.env.OPS_ENABLED ?? (process.env.NODE_ENV === "development" ? "1" : undefined);
  return v === "1";
}

/**
 * GET /api/ops/sql-query
 * Get SQL query history
 */
export const GET = withErrorHandler(async () => {
  if (!isOpsEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ctx = await requirePlatformAdmin();
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
  }

  const history = await getSqlQueryHistory(ctx.user.id, 50);
  return NextResponse.json({ history });
});

/**
 * POST /api/ops/sql-query
 * Execute read-only SQL query
 */
export const POST = withErrorHandler(async (request: Request) => {
  if (!isOpsEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

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
});
