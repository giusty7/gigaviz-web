import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getHealthSummary } from "@/lib/ops/health";

/**
 * GET /api/ops/health
 * Get system health summary
 */
export async function GET() {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn("[ops] health: no user session", { userError });
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { data: adminRow, error: adminError } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("[ops] health: admin lookup failed", { adminError, userId: user.id });
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    const isAdmin = Boolean(adminRow?.user_id);

    console.info("[ops] health request", { userId: user.id, isAdmin });

    if (!isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const summary = await getHealthSummary();

    return NextResponse.json(summary);
  } catch (err) {
    console.error("[ops] Get health summary error:", err);

    // Map Supabase P0001 unauthorized to 403
    const status = (err as { code?: string })?.code === "P0001" ? 403 : 500;

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status }
    );
  }
}
