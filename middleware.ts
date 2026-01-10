import { NextResponse, type NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

const PROD =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req: NextRequest) {
  if (PROD && req.nextUrl.pathname.startsWith("/admin")) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return withSupabaseAuth(req);
}
