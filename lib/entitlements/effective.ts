import "server-only";

import { unstable_noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getWorkspaceEffectiveEntitlements(workspaceId: string): Promise<string[]> {
  unstable_noStore();
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("workspace_entitlements")
    .select("key, enabled, expires_at")
    .eq("workspace_id", workspaceId);

  if (error) return [];

  const now = Date.now();
  const active = (data ?? []).filter((row) => {
    if (!row?.enabled) return false;
    if (!row.expires_at) return true;
    const expires = new Date(row.expires_at).getTime();
    return Number.isFinite(expires) && expires > now;
  });

  return active
    .map((row) => row.key)
    .filter((key): key is string => typeof key === "string");
}
