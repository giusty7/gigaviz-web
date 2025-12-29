import type { NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  return withSupabaseAuth(req);
}

// jalankan middleware utk /admin, /login, dan /api/admin (biar export CSV aman)
export const config = {
  matcher: ["/admin/:path*", "/login", "/api/admin/:path*"],
};
