import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getWebhookLogs, getWebhookLog } from "@/lib/ops/webhooks";

/**
 * GET /api/ops/webhooks
 * List webhook logs with filters
 */
export async function GET(request: Request) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
    console.error("[ops] webhooks error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}
