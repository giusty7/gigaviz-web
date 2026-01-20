import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

type MetaTokenRow = {
  token_encrypted: string | null;
  provider: string | null;
  expires_at: string | null;
  scopes_json: Record<string, unknown> | null;
  created_at: string | null;
};

export type ResolvedMetaToken = {
  token: string;
  provider: string;
  expiresAt: string | null;
  scopes: Record<string, unknown> | null;
};

function sanitizeToken(value: string) {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  if (/\s/.test(unquoted)) {
    throw new Error("Invalid access token (contains whitespace)");
  }
  return unquoted;
}

function envFallbackToken() {
  const names = [
    "META_SYSTEM_USER_TOKEN",
    "WA_ACCESS_TOKEN",
    "WA_CLOUD_API_TOKEN",
    "WA_CLOUD_API_SYSTEM_USER_TOKEN",
  ];
  for (const name of names) {
    const val = process.env[name];
    if (val) return { token: sanitizeToken(val), provider: name.toLowerCase(), expiresAt: null };
  }
  return null;
}

const PROVIDER_PRIORITY = ["meta_system_user", "meta_whatsapp", "meta_oauth", "meta"];

export async function resolveWorkspaceMetaToken(workspaceId: string): Promise<ResolvedMetaToken> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("meta_tokens")
    .select("token_encrypted, provider, expires_at, scopes_json, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    logger.error("[meta-token] lookup failed", { workspaceId, message: error.message });
  }

  const now = Date.now();
  const rows = (data ?? []) as MetaTokenRow[];

  const sorted = rows
    .filter((row) => {
      if (!row.token_encrypted) return false;
      if (!row.expires_at) return true;
      const expiresMs = new Date(row.expires_at).getTime();
      return Number.isFinite(expiresMs) ? expiresMs > now : true;
    })
    .sort((a, b) => {
      const aIdx = PROVIDER_PRIORITY.indexOf((a.provider || "").toLowerCase());
      const bIdx = PROVIDER_PRIORITY.indexOf((b.provider || "").toLowerCase());
      if (aIdx !== bIdx) return (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) - (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx);
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });

  const candidate = sorted[0];
  if (candidate?.token_encrypted) {
    return {
      token: sanitizeToken(candidate.token_encrypted),
      provider: candidate.provider ?? "meta_token",
      expiresAt: candidate.expires_at ?? null,
      scopes: candidate.scopes_json ?? null,
    };
  }

  const fallback = envFallbackToken();
  if (fallback) {
    return { token: fallback.token, provider: fallback.provider, expiresAt: fallback.expiresAt, scopes: null };
  }

  throw new Error("Meta access token not found for workspace");
}

export async function getWorkspaceMetaAccessToken(workspaceId: string) {
  const { token } = await resolveWorkspaceMetaToken(workspaceId);
  return token;
}
