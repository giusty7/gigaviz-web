import { NextResponse, type NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

const PROD =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const PUBLIC_FILE = /\.(.*)$/;

/** Supported locale prefixes */
const LOCALE_SET = new Set(["en", "id"]);
const DEFAULT_LOCALE = "en";

/** Known marketing/public route segments (NOT workspace slugs) */
const MARKETING_SEGMENTS = new Set([
  "about",
  "pricing",
  "products",
  "blog",
  "changelog",
  "contact",
  "get-started",
  "media-kit",
  "status",
  "policies",
  "roadmap",
  "trust",
  "integrations",
  "data-deletion",
]);

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

  // ✅ Detect locale prefix (e.g. /id/pricing → locale="id", rest="/pricing")
  const localeMatch = path.match(/^\/(en|id)(\/|$)/);
  const locale = localeMatch?.[1];
  const normalizedPath = locale
    ? path.replace(new RegExp(`^/${locale}`), "") || "/"
    : path;

  // ✅ Skip locale routing for authenticated app routes
  const isAppRoute =
    normalizedPath.startsWith("/ops") ||
    normalizedPath.startsWith("/owner") ||
    normalizedPath.startsWith("/login") ||
    normalizedPath.startsWith("/register") ||
    normalizedPath.startsWith("/logout") ||
    normalizedPath.startsWith("/forgot-password") ||
    normalizedPath.startsWith("/reset-password") ||
    normalizedPath.startsWith("/verify-email") ||
    normalizedPath.startsWith("/invite") ||
    normalizedPath.startsWith("/auth") ||
    normalizedPath.startsWith("/onboarding") ||
    normalizedPath.startsWith("/dashboard");

  // Workspace slug detection (lowercase alphanumeric + hyphens, 3+ chars)
  // Exclude known marketing segments and locale prefixes
  const segments = normalizedPath.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const looksLikeWorkspaceSlug =
    /^[a-z0-9][a-z0-9-]{2,}$/.test(firstSegment) &&
    !LOCALE_SET.has(firstSegment) &&
    !MARKETING_SEGMENTS.has(firstSegment);

  // If locale prefix on app/workspace route, redirect to clean path
  if (locale && (isAppRoute || looksLikeWorkspaceSlug)) {
    const url = req.nextUrl.clone();
    url.pathname = normalizedPath;
    return NextResponse.redirect(url);
  }

  if (isAppRoute || looksLikeWorkspaceSlug) {
    return withSupabaseAuth(req);
  }

  // ✅ Marketing routes — handle locale prefix via rewrite + cookie
  //    This project does NOT use a [locale] folder, so we use the
  //    "without i18n routing" approach: cookie-based locale in i18n/request.ts.

  if (locale) {
    // Default locale (en) shouldn't have a URL prefix → redirect to clean path
    if (locale === DEFAULT_LOCALE) {
      const url = req.nextUrl.clone();
      url.pathname = normalizedPath;
      const res = NextResponse.redirect(url);
      res.cookies.set("NEXT_LOCALE", DEFAULT_LOCALE, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return res;
    }

    // Non-default locale (e.g. /id/pricing):
    //   1. Set NEXT_LOCALE cookie so i18n/request.ts picks it up
    //   2. Rewrite to the real path (strip prefix) so Next.js finds the route
    const url = req.nextUrl.clone();
    url.pathname = normalizedPath;
    const res = NextResponse.rewrite(url);
    res.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  }

  // No locale prefix — serve normally (i18n/request.ts reads cookie for locale)
  return withSupabaseAuth(req);
}
