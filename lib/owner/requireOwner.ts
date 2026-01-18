import "server-only";

import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

type OwnerMember = {
  user_id: string;
  email: string | null;
  role: string;
  active: boolean | null;
};

export type OwnerContext =
  | {
      ok: true;
      user: User;
      member: OwnerMember;
      actorEmail: string | null;
      actorRole: string;
      db: ReturnType<typeof supabaseAdmin>;
    }
  | { ok: false; reason: "not_authenticated" | "not_owner" };

export async function requireOwner(): Promise<OwnerContext> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error || !user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const db = supabaseAdmin();
  const { data: member } = await db
    .from("owner_members")
    .select("user_id, email, role, active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || member.active === false) {
    return { ok: false, reason: "not_owner" };
  }

  return {
    ok: true,
    user,
    member: {
      user_id: member.user_id,
      email: member.email ?? user.email ?? null,
      role: member.role ?? "owner",
      active: member.active ?? true,
    },
    actorEmail: member.email ?? user.email ?? null,
    actorRole: member.role ?? "owner",
    db,
  };
}
