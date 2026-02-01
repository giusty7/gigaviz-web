import { NextRequest, NextResponse } from "next/server";
import { searchCustomers } from "@/lib/ops/customers";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  try {
    const results = await searchCustomers(query, limit);
    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error("Customer search API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "search failed" },
      { status: 500 }
    );
  }
}
