import { NextResponse, type NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

const PROD =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

const PUBLIC_FILE = /\.(.*)$/;

export const config = {
  // Keep matcher simple (no complex regex / no capturing groups)
  matcher: ["/:path*"],
};

export async function middleware(req: NextRequest) {
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

  // ✅ Keep existing Supabase auth middleware
  return withSupabaseAuth(req);
}
