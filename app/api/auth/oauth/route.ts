import { NextRequest, NextResponse } from "next/server";
import { type Provider } from "@supabase/supabase-js";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { rateLimit } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`auth-oauth:${ip}`, { windowMs: 60_000, max: 10 });

  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: limit.resetAt },
      { status: 429 }
    );
  }

  const providerParam = req.nextUrl.searchParams.get("provider");
  const providerKey = (providerParam || "").toLowerCase();
  const nextParam = req.nextUrl.searchParams.get("next");
  if (providerKey !== "google") {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 });
  }
  const provider: Provider = providerKey;

  const { supabase, withCookies } = createSupabaseRouteClient(req);

  const origin = req.nextUrl.origin;
  const nextSafe = nextParam && nextParam.startsWith("/") ? nextParam : "/app";
  const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(nextSafe)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error || !data?.url) {
    return NextResponse.json({ error: error?.message || "oauth_failed" }, { status: 400 });
  }

  return withCookies(NextResponse.redirect(data.url));
});
