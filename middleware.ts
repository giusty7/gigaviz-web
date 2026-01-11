import { NextResponse, type NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

const PROD =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

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

  if (PROD && req.nextUrl.pathname.startsWith("/admin")) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return withSupabaseAuth(req);
}
