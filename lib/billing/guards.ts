import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWorkspaceEntitlements } from "@/lib/entitlements/server";
import { getWallet } from "@/lib/tokens";
import type { FeatureKey } from "@/lib/entitlements";

type TokenBudgetAllowed = {
  allowed: true;
  balance: number;
  cap: number | null;
  used: number;
};

type TokenBudgetDenied = {
  allowed: false;
  reason: "insufficient_tokens" | "cap_exceeded";
  balance: number;
  cap: number | null;
  used: number;
};

function monthStartUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function sumUsage(rows: Array<{ delta_bigint?: number | null; amount?: number | null; type?: string | null }>) {
  return rows.reduce((total, row) => {
    if (row.type === "usage" && row.amount !== null && row.amount !== undefined) {
      return total + Math.abs(Number(row.amount));
    }
    const delta = Number(row.delta_bigint ?? 0);
    if (delta < 0) return total + Math.abs(delta);
    return total;
  }, 0);
}

export async function assertEntitlement(workspaceId: string, feature: FeatureKey) {
  const ent = await getWorkspaceEntitlements(workspaceId);
  return {
    allowed: Boolean(ent.features[feature]),
    entitlements: ent,
  };
}

export async function assertTokenBudget(
  workspaceId: string,
  costTokens: number
): Promise<TokenBudgetAllowed | TokenBudgetDenied> {
  const wallet = await getWallet(workspaceId);
  const balance = Number(wallet.balance_bigint ?? 0);
  const db = supabaseAdmin();
  const { data: walletMeta } = await db
    .from("token_wallets")
    .select("monthly_cap")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const capRaw = walletMeta?.monthly_cap ?? null;
  const capValue = capRaw !== null && capRaw !== undefined ? Number(capRaw) : null;
  const normalizedCap =
    capValue !== null && Number.isFinite(capValue) && capValue > 0 ? capValue : null;

  const monthStart = monthStartUTC();
  const { data: ledgerRows } = await db
    .from("token_ledger")
    .select("delta_bigint, amount, type")
    .eq("workspace_id", workspaceId)
    .gte("created_at", monthStart.toISOString());

  const used = sumUsage((ledgerRows ?? []) as Array<{ delta_bigint?: number; amount?: number; type?: string }>);

  if (balance < costTokens) {
    return { allowed: false, reason: "insufficient_tokens", balance, cap: normalizedCap, used };
  }

  if (normalizedCap !== null && used + costTokens > normalizedCap) {
    return { allowed: false, reason: "cap_exceeded", balance, cap: normalizedCap, used };
  }

  return { allowed: true, balance, cap: normalizedCap, used };
}
