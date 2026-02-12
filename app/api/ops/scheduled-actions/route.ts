import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import {
  getScheduledActions,
  createScheduledAction,
  cancelScheduledAction,
} from "@/lib/ops/bulk-ops";
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
    const status = searchParams.get("status") as
      | "pending"
      | "executed"
      | "cancelled"
      | "failed"
      | undefined;
    const targetId = searchParams.get("target_id") || undefined;

    const actions = await getScheduledActions({ status, targetId, limit: 100 });
    return NextResponse.json({ actions });
  } catch (error) {
    logger.error("[ops] scheduled-actions error", { error: error instanceof Error ? error.message : String(error) });
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
    const { action: reqAction } = body;

    if (reqAction === "create") {
      const {
        action_type,
        target_type,
        target_id,
        payload,
        reason,
        scheduled_for,
      } = body;

      if (!scheduled_for) {
        return NextResponse.json(
          { error: "scheduled_for is required" },
          { status: 400 }
        );
      }

      const scheduledAction = await createScheduledAction({
        action_type,
        target_type,
        target_id,
        payload,
        reason,
        scheduled_for,
        created_by: ctx.user.id,
      });
      return NextResponse.json(scheduledAction);
    }

    if (reqAction === "cancel") {
      const { action_id } = body;
      const scheduledAction = await cancelScheduledAction(action_id, ctx.user.id);
      return NextResponse.json(scheduledAction);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("[ops] scheduled-actions error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
