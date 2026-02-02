import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getBulkJobs,
  getBulkJob,
  createBulkJob,
  updateBulkJob,
  cancelBulkJob,
  previewBulkOperation,
} from "@/lib/ops/bulk-ops";

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
    console.error("[ops] bulk-jobs error:", error);
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
        created_by: user.id,
      });
      return NextResponse.json(job);
    }

    if (action === "cancel") {
      const { job_id } = body;
      const job = await cancelBulkJob(job_id, user.id);
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
    console.error("[ops] bulk-jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
