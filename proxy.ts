import { NextResponse, type NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const PROD =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const PUBLIC_FILE = /\.(.*)$/;

/**
 * next-intl middleware for locale detection & routing.
 * Uses "as-needed" prefix: default locale (en) has no prefix,
 * non-default locales get /id/... prefix.
 */
const intlMiddleware = createMiddleware(routing);

export const config = {
  // Keep matcher simple (no complex regex / no capturing groups)
  matcher: ["/:path*"],
};

// Next.js 16 proxy entrypoint (renamed from middleware)
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ✅ Skip Next internals & static assets early
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/brand") ||
    path === "/favicon.ico" ||
    path === "/icon.png" ||
    path === "/apple-icon.png" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    PUBLIC_FILE.test(path)
  ) {
    return NextResponse.next();
  }

  // ✅ Back-compat: old "/app" prefix
  if (path === "/app") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/app/") && !path.startsWith("/app/api")) {
    const url = req.nextUrl.clone();
    url.pathname = path.replace(/^\/app/, "");
    return NextResponse.redirect(url);
  }

  // ✅ Hide /admin in production
  if (PROD && path.startsWith("/admin")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // ✅ Skip locale routing for authenticated app routes (workspace slugs)
  //    and ops/owner/auth routes — these don't need locale prefix
  const isAppRoute =
    path.startsWith("/ops") ||
    path.startsWith("/owner") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/logout") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/verify-email") ||
    path.startsWith("/invite") ||
    path.startsWith("/auth") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/dashboard");

  // For workspace routes like /my-workspace/inbox, detect workspace slug pattern
  // Workspace slugs are lowercase alphanumeric + hyphens, 3+ chars
  const segments = path.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const looksLikeWorkspaceSlug =
    /^[a-z0-9][a-z0-9-]{2,}$/.test(firstSegment) &&
    !["en", "id"].includes(firstSegment); // Not a locale prefix

  if (isAppRoute || looksLikeWorkspaceSlug) {
    // Skip locale routing, go straight to Supabase auth
    return withSupabaseAuth(req);
  }

  // ✅ Marketing routes: apply next-intl locale detection + Supabase auth
  const intlResponse = intlMiddleware(req);

  // If intl middleware produced a redirect (e.g. adding locale prefix), return it
  if (intlResponse.headers.get("x-middleware-rewrite") || intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // Otherwise, continue with Supabase auth (merges cookies/headers)
  const authResponse = await withSupabaseAuth(req);

  // Merge intl headers into auth response
  intlResponse.headers.forEach((value, key) => {
    authResponse.headers.set(key, value);
  });

  return authResponse;
}
