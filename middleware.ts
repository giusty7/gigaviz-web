import type { NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  return withSupabaseAuth(req);
}

// jalankan middleware utk /admin dan /login (biar bisa redirect & refresh session)
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
