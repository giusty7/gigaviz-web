import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import {
  getBulkJobs,
  getBulkJob,
  createBulkJob,
  updateBulkJob,
  cancelBulkJob,
  previewBulkOperation,
} from "@/lib/ops/bulk-ops";
import { logger } from "@/lib/logging";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "preview") {
      const { operation_type, target_type, target_filter } = body;
      const preview = await previewBulkOperation(
        operation_type,
        target_type,
        target_filter || {}
      );
      return NextResponse.json(preview);
    }

    if (action === "create") {
      const {
        operation_type,
        target_type,
        target_filter,
        payload,
        scheduled_for,
      } = body;

      const job = await createBulkJob({
        operation_type,
        target_type,
        target_filter,
        payload,
        scheduled_for,
        created_by: ctx.user.id,
      });
      return NextResponse.json(job);
    }

    if (action === "cancel") {
      const { job_id } = body;
      const job = await cancelBulkJob(job_id, ctx.user.id);
      return NextResponse.json(job);
    }

    if (action === "start") {
      const { job_id } = body;
      const job = await updateBulkJob(job_id, {
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
}
