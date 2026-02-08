import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { getWebhookLogs, getWebhookLog } from "@/lib/ops/webhooks";
import { logger } from "@/lib/logging";

/**
 * GET /api/ops/webhooks
 * List webhook logs with filters
 */
export async function GET(request: Request) {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const webhookType = searchParams.get("type") || undefined;
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const hasError = searchParams.get("hasError") === "true" ? true : undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const logId = searchParams.get("id");

    // Get single log
    if (logId) {
      const log = await getWebhookLog(logId);
      if (!log) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return NextResponse.json(log);
    }

    // List logs
    const result = await getWebhookLogs({
      webhookType,
      workspaceId,
      hasError,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("[ops] webhooks error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
