import type { NextRequest } from "next/server";
import { withSupabaseAuth } from "@/lib/supabase/middleware";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function proxy(req: NextRequest) {
  return withSupabaseAuth(req);
}
