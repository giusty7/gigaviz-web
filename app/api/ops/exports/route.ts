import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import {
  getExportJobs,
  createExportJob,
  updateExportJob,
  generateWorkspacesExport,
  generateUsersExport,
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
    const status = searchParams.get("status") as
      | "pending"
      | "processing"
      | "completed"
      | "failed"
      | undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 20;

    const jobs = await getExportJobs({ status, limit });
    return NextResponse.json({ jobs });
  } catch (error) {
    logger.error("[ops] exports error", { error: error instanceof Error ? error.message : String(error) });
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
    const { export_type, format, filters } = body;

    if (!export_type || !format) {
      return NextResponse.json(
        { error: "Missing export_type or format" },
        { status: 400 }
      );
    }

    // Create export job
    const job = await createExportJob({
      export_type,
      format,
      filters: filters || {},
      created_by: ctx.user.id,
    });

    // Process immediately for small exports (in real app, use background job)
    try {
      await updateExportJob(job.id, {
        status: "processing",
        started_at: new Date().toISOString(),
      });

      let data: Record<string, unknown>[] = [];

      switch (export_type) {
        case "workspaces":
          data = await generateWorkspacesExport(filters || {});
          break;
        case "users":
          data = await generateUsersExport(filters || {});
          break;
        default:
          throw new Error(`Unsupported export type: ${export_type}`);
      }

      // For now, return data directly. In production, upload to storage
      const result = format === "json" ? data : data;

      await updateExportJob(job.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        row_count: data.length,
      });

      return NextResponse.json({
        success: true,
        job_id: job.id,
        row_count: data.length,
        data: result,
      });
    } catch (exportError) {
      await updateExportJob(job.id, {
        status: "failed",
        error_message:
          exportError instanceof Error
            ? exportError.message
            : "Unknown error",
      });
      throw exportError;
    }
  } catch (error) {
    logger.error("[ops] exports error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
