import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`auth-otp:${ip}`, { windowMs: 60_000, max: 5 });

  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: limit.resetAt },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const nextParam = typeof body?.next === "string" ? body.next : null;

  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, anon);

  const origin = process.env.APP_BASE_URL || req.nextUrl.origin;
  const nextSafe = nextParam && nextParam.startsWith("/") ? nextParam : "/app";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextSafe)}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
