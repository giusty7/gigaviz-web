import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { logger } from "@/lib/logging";

function getSafeNext(nextParam: string | null) {
  if (!nextParam) return "/app";
  return nextParam.startsWith("/") ? nextParam : "/app";
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(req);

    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get("code");
    const next = getSafeNext(requestUrl.searchParams.get("next"));

    logger.dev("auth-callback", { codePresent: Boolean(code), next });

    if (!code) {
      logger.warn("Auth callback missing code");
      return withCookies(
        NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin))
      );
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.warn("Auth callback exchange failed", { error: error.message });
      return withCookies(
        NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      );
    }

    logger.dev("auth-callback exchange ok, redirecting");
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    return withCookies(response);
  } catch (err) {
    logger.error("Auth callback unhandled error", { error: err instanceof Error ? err.message : String(err) });
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(new URL("/login?error=callback_error", origin));
  }
}
