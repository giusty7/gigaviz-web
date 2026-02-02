import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getExportJobs,
  createExportJob,
  updateExportJob,
  generateWorkspacesExport,
  generateUsersExport,
} from "@/lib/ops/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check platform admin
    const { data: adminCheck } = await supabaseAdmin()
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    console.error("[ops] exports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check platform admin
    const { data: adminCheck } = await supabaseAdmin()
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      created_by: user.id,
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
    console.error("[ops] exports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
