import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getAnalyticsSummary,
  getMetricsSnapshots,
  generateDailySnapshot,
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
    const action = searchParams.get("action") || "summary";

    if (action === "summary") {
      const summary = await getAnalyticsSummary();
      return NextResponse.json(summary);
    }

    if (action === "snapshots") {
      const periodType = searchParams.get("period") as
        | "daily"
        | "weekly"
        | "monthly"
        | undefined;
      const startDate = searchParams.get("start") || undefined;
      const endDate = searchParams.get("end") || undefined;
      const limit = searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 30;

      const snapshots = await getMetricsSnapshots({
        periodType,
        startDate,
        endDate,
        limit,
      });
      return NextResponse.json({ snapshots });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[ops] analytics error:", error);
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
    const { action, targetDate } = body;

    if (action === "generate_snapshot") {
      const snapshotId = await generateDailySnapshot(targetDate);
      return NextResponse.json({ success: true, snapshot_id: snapshotId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[ops] analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
