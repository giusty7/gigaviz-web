import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import {
  getScheduledActions,
  createScheduledAction,
  cancelScheduledAction,
} from "@/lib/ops/bulk-ops";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const scheduledActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    action_type: z.enum(["plan_change", "feature_toggle", "suspension", "notification"]),
    target_type: z.enum(["workspace", "user", "subscription"]),
    target_id: z.string().min(1, "target_id required"),
    payload: z.record(z.string(), z.unknown()).optional().default({}),
    reason: z.string().min(1).max(1000),
    scheduled_for: z.string().min(1, "scheduled_for required"),
  }),
  z.object({
    action: z.literal("cancel"),
    action_id: z.string().min(1, "action_id required"),
  }),
]);

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

    const raw = await request.json();
    const body = scheduledActionSchema.parse(raw);

    if (body.action === "create") {
      const scheduledAction = await createScheduledAction({
        action_type: body.action_type,
        target_type: body.target_type,
        target_id: body.target_id,
        payload: body.payload,
        reason: body.reason,
        scheduled_for: body.scheduled_for,
        created_by: ctx.user.id,
      });
      return NextResponse.json(scheduledAction);
    }

    if (body.action === "cancel") {
      const scheduledAction = await cancelScheduledAction(body.action_id, ctx.user.id);
      return NextResponse.json(scheduledAction);
    }
  } catch (error) {
    logger.error("[ops] scheduled-actions error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
