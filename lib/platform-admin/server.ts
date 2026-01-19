import "server-only";

import { unstable_noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

type CurrentUser = {
  userId: string | null;
  email: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  unstable_noStore();
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  return {
    userId: user?.id ?? null,
    email: user?.email ?? null,
  };
}

export function isOwnerEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = process.env.GIGAVIZ_OWNER_EMAILS ?? process.env.ADMIN_EMAILS ?? "";
  const parts = allowlist
    .split(",")
    .map((val) => val.trim().toLowerCase())
    .filter(Boolean);
  return parts.includes(email.toLowerCase());
}

export async function isPlatformAdminById(userId: string | null | undefined): Promise<boolean> {
  unstable_noStore();
  if (!userId) return false;
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.user_id);
}

