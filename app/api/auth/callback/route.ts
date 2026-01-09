import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";

const DEV = process.env.NODE_ENV === "development";

function getSafeNext(nextParam: string | null) {
  if (!nextParam) return "/app";
  return nextParam.startsWith("/") ? nextParam : "/app";
}

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);

  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNext(requestUrl.searchParams.get("next"));

  if (DEV) {
    console.log("[auth-callback] code present", Boolean(code));
    console.log("[auth-callback] next", next);
  }

  if (!code) {
    if (DEV) {
      console.warn("[auth-callback] missing code");
    }
    return withCookies(
      NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin))
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    if (DEV) {
      console.warn("[auth-callback] exchange failed", error.message);
    }
    return withCookies(
      NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    );
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  const withCookiesResponse = withCookies(response);
  if (DEV) {
    console.log("[auth-callback] exchange ok, redirecting with cookies");
  }
  return withCookiesResponse;
}
