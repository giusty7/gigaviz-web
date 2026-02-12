import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";

const bulkJobActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("preview"),
    operation_type: z.enum(["email", "plan_change", "feature_toggle", "notification"]),
    target_type: z.enum(["workspaces", "users", "subscriptions"]),
    target_filter: z.record(z.string(), z.unknown()).default({}),
  }),
  z.object({
    action: z.literal("create"),
    operation_type: z.enum(["email", "plan_change", "feature_toggle", "notification"]),
    target_type: z.enum(["workspaces", "users", "subscriptions"]),
    target_filter: z.record(z.string(), z.unknown()).default({}),
    payload: z.record(z.string(), z.unknown()).default({}),
    scheduled_for: z.string().nullish().transform(v => v ?? null),
  }),
  z.object({
    action: z.literal("cancel"),
    job_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("start"),
    job_id: z.string().uuid(),
  }),
]);
import {
  getBulkJobs,
  getBulkJob,
  createBulkJob,
  updateBulkJob,
  cancelBulkJob,
  previewBulkOperation,
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
    const id = searchParams.get("id");
    const status = searchParams.get("status") as
      | "draft"
      | "pending"
      | "processing"
      | "completed"
      | "failed"
      | "cancelled"
      | undefined;

    if (id) {
      const job = await getBulkJob(id);
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json(job);
    }

    const jobs = await getBulkJobs({ status, limit: 50 });
    return NextResponse.json({ jobs });
  } catch (error) {
    logger.error("[ops] bulk-jobs error", { error: error instanceof Error ? error.message : String(error) });
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
    const validated = bulkJobActionSchema.parse(body);

    if (validated.action === "preview") {
      const preview = await previewBulkOperation(
        validated.operation_type,
        validated.target_type,
        validated.target_filter || {}
      );
      return NextResponse.json(preview);
    }

    if (validated.action === "create") {
      const job = await createBulkJob({
        operation_type: validated.operation_type,
        target_type: validated.target_type,
        target_filter: validated.target_filter,
        payload: validated.payload,
        scheduled_for: validated.scheduled_for,
        created_by: ctx.user.id,
      });
      return NextResponse.json(job);
    }

    if (validated.action === "cancel") {
      const job = await cancelBulkJob(validated.job_id, ctx.user.id);
      return NextResponse.json(job);
    }

    if (validated.action === "start") {
      const job = await updateBulkJob(validated.job_id, {
        status: "pending",
      });
      return NextResponse.json(job);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("[ops] bulk-jobs error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
