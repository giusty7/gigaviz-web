import type { NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  return withSupabaseAuth(req);
}

// jalankan middleware utk /admin, /login, dan /api/admin (biar export CSV aman)
export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/logout",
    "/onboarding",
    "/app/onboarding",
    "/app/:path*",
    "/api/admin/:path*",
    "/api/auth/:path*",
    "/api/tokens/:path*",
    "/api/workspaces/:path*",
    "/api/subscriptions/:path*",
  ],
};
