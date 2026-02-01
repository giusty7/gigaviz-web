import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { executeSqlQuery, getSqlQueryHistory } from "@/lib/ops/sql-runner";

/**
 * GET /api/ops/sql-query
 * Get SQL query history
 */
export async function GET() {
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

    const history = await getSqlQueryHistory(user.id, 50);

    return NextResponse.json({ history });
  } catch (err) {
    console.error("[ops] sql-query GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ops/sql-query
 * Execute read-only SQL query
 */
export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
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

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: "query_required" }, { status: 400 });
    }

    const result = await executeSqlQuery({
      query,
      adminId: user.id,
      adminEmail: user.email,
    });

    if (result.error) {
      return NextResponse.json(
        {
          rows: [],
          rowCount: 0,
          executionTimeMs: result.executionTimeMs,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ops] sql-query POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal_error" },
      { status: 500 }
    );
  }
}
