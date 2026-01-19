import "server-only";

import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type PlatformAdminContext =
  | {
      ok: true;
      user: User;
      actorEmail: string | null;
      actorRole: string;
      db: ReturnType<typeof supabaseAdmin>;
    }
  | { ok: false; reason: "not_authenticated" | "not_platform_admin" };

export async function requirePlatformAdmin(): Promise<PlatformAdminContext> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error || !user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const db = supabaseAdmin();
  const { data: adminRow } = await db
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow?.user_id) {
    return { ok: false, reason: "not_platform_admin" };
  }

  return {
    ok: true,
    user,
    actorEmail: user.email ?? null,
    actorRole: "platform_admin",
    db,
  };
}
