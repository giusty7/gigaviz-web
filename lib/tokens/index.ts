import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FeatureKey } from "@/lib/entitlements";
import type { TokenActionKey } from "@/lib/tokenRates";

export const tokenActionFeatureMap: Record<TokenActionKey, FeatureKey> = {
  helper_chat: "helper",
  graph_generate_image: "graph",
  tracks_generate: "tracks",
  office_export: "office",
  meta_send_message: "meta_send",
  mass_blast_send: "mass_blast",
};

export type TokenLedgerMetadata = {
  feature_key?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  note?: string | null;
  created_by?: string | null;
};

export async function getWallet(workspaceId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("token_wallets")
    .select("workspace_id, balance_bigint, updated_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: createErr } = await db
    .from("token_wallets")
    .insert({ workspace_id: workspaceId, balance_bigint: 0 })
    .select("workspace_id, balance_bigint, updated_at")
    .single();

  if (createErr) throw createErr;
  return created;
}

export async function getLedger(
  workspaceId: string,
  options: { page?: number; pageSize?: number } = {}
) {
  const { page = 1, pageSize = 20 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("token_ledger")
    .select(
      "id, workspace_id, delta_bigint, reason, feature_key, ref_type, ref_id, note, created_by, created_at"
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data ?? [];
}

export async function requireTokens(
  workspaceId: string,
  cost: number,
  metadata?: TokenLedgerMetadata
) {
  const wallet = await getWallet(workspaceId);
  const balance = Number(wallet.balance_bigint ?? 0);
  if (balance < cost) {
    const err = new Error("insufficient_tokens");
    (err as Error & { metadata?: TokenLedgerMetadata }).metadata = metadata;
    throw err;
  }
  return wallet;
}

export async function consumeTokens(
  workspaceId: string,
  cost: number,
  metadata: TokenLedgerMetadata = {}
) {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("consume_tokens", {
    p_workspace_id: workspaceId,
    p_cost: cost,
    p_reason: "consume",
    p_feature_key: metadata.feature_key ?? null,
    p_ref_type: metadata.ref_type ?? null,
    p_ref_id: metadata.ref_id ?? null,
    p_note: metadata.note ?? null,
    p_created_by: metadata.created_by ?? null,
  });

  if (error) throw error;
  return data;
}

export async function creditTokens(
  workspaceId: string,
  amount: number,
  reason: "purchase" | "admin_credit" = "purchase",
  note?: string | null,
  createdBy?: string | null
) {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("credit_tokens", {
    p_workspace_id: workspaceId,
    p_amount: amount,
    p_reason: reason,
    p_note: note ?? null,
    p_created_by: createdBy ?? null,
  });

  if (error) throw error;
  return data;
}
