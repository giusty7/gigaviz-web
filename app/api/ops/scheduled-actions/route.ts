import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getScheduledActions,
  createScheduledAction,
  cancelScheduledAction,
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
    console.error("[ops] scheduled-actions error:", error);
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
        created_by: user.id,
      });
      return NextResponse.json(scheduledAction);
    }

    if (reqAction === "cancel") {
      const { action_id } = body;
      const scheduledAction = await cancelScheduledAction(action_id, user.id);
      return NextResponse.json(scheduledAction);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[ops] scheduled-actions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
