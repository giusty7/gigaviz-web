import "server-only";

import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

export async function ensureProfile(user: User) {
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const shouldBeAdmin = isAdminEmail(user.email);
  const isAdmin = existing?.is_admin || shouldBeAdmin || false;

  const { data, error } = await db
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        is_admin: isAdmin,
      },
      { onConflict: "id" }
    )
    .select("id, email, full_name, avatar_url, is_admin")
    .single();

  if (error) throw error;
  return data;
}
