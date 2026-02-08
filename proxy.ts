import { NextResponse, type NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

const PROD =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const PUBLIC_FILE = /\.(.*)$/;

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

  // ✅ Marketing routes: apply Supabase auth (locale is resolved by next-intl/server at render time)
  return withSupabaseAuth(req);
}
