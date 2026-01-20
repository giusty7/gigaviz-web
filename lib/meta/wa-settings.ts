import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type WhatsappSandboxSettings = {
  sandboxEnabled: boolean;
  whitelist: string[];
};

export async function getWhatsappSandboxSettings(
  workspaceId: string
): Promise<WhatsappSandboxSettings> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("wa_settings")
    .select("sandbox_enabled, test_whitelist")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const whitelist: string[] = Array.isArray(data?.test_whitelist)
    ? (data?.test_whitelist as string[])
    : [];

  return {
    sandboxEnabled: data?.sandbox_enabled !== false,
    whitelist,
  };
}
