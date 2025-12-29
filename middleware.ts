import type { NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  return withSupabaseAuth(req);
}

// Kunci /admin dan seluruh turunannya, plus /login (buat refresh session & redirect)
export const config = {
  matcher: ["/admin", "/admin/:path*", "/login"],
}