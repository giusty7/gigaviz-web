import "server-only";

import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin() is server-only and must not run in the browser.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceRole) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for supabaseAdmin().");
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
