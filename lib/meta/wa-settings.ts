import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type WaSettingsRow = {
  workspace_id: string;
  sandbox_enabled: boolean | null;
  test_whitelist: unknown;
  waba_id?: string | null;
  phone_number_id?: string | null;
};

export type WhatsappSandboxSettings = {
  sandboxEnabled: boolean;
  whitelist: string[];
  raw: WaSettingsRow | null;
};

const DEFAULT_WHITELIST: string[] = [];

function normalizeWhitelist(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_WHITELIST;
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

async function fetchSettings(workspaceId: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("wa_settings")
    .select("workspace_id, sandbox_enabled, test_whitelist, waba_id, phone_number_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data as WaSettingsRow | null;
}

async function insertDefaultSettings(workspaceId: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("wa_settings")
    .insert({ workspace_id: workspaceId })
    .select("workspace_id, sandbox_enabled, test_whitelist, waba_id, phone_number_id")
    .maybeSingle();
  return data as WaSettingsRow | null;
}

export async function getWaSettings(workspaceId: string): Promise<WhatsappSandboxSettings> {
  const existing = await fetchSettings(workspaceId);
  const row = existing ?? (await insertDefaultSettings(workspaceId));

  const whitelist = normalizeWhitelist(row?.test_whitelist);

  // Default sandbox to OFF (false) if sandbox_enabled is null
  return {
    sandboxEnabled: row?.sandbox_enabled === true,
    whitelist,
    raw: row ?? null,
  };
}

export async function getWhatsappSandboxSettings(
  workspaceId: string
): Promise<WhatsappSandboxSettings> {
  return getWaSettings(workspaceId);
}
