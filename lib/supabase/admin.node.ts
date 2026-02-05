import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load .env.local first (project convention), then .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env ${name}`);
  return val;
}

export function supabaseAdmin() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
