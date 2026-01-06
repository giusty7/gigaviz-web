import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const slugPattern = /^[a-z0-9-]{3,32}$/;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`workspace-check:${ip}`, { windowMs: 60_000, max: 30 });

  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: limit.resetAt },
      { status: 429 }
    );
  }

  const slugParam = req.nextUrl.searchParams.get("slug");
  const slug = (slugParam || "").trim().toLowerCase();

  if (!slug || !slugPattern.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("workspaces")
    .select("id")
    .ilike("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "check_failed" }, { status: 500 });
  }

  return NextResponse.json({ available: !data });
}
