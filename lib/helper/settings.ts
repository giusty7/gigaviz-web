import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type HelperSettings = {
  workspace_id: string;
  allow_automation: boolean;
  monthly_cap: number;
};

export async function getHelperSettings(workspaceId: string): Promise<HelperSettings> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("helper_settings")
    .select("workspace_id, allow_automation, monthly_cap")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (data) return data;

  // Create default row lazily
  const defaults: HelperSettings = {
    workspace_id: workspaceId,
    allow_automation: true,
    monthly_cap: 0,
  };
  await db.from("helper_settings").upsert(defaults, { onConflict: "workspace_id" });
  return defaults;
}
