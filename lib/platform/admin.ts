import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore } from "next/cache";

export async function isPlatformAdmin(supabase: SupabaseClient): Promise<boolean> {
  unstable_noStore();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return false;

  const { data: row, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return false;
  return Boolean(row?.user_id);
}
