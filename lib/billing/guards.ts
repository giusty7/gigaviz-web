import "server-only";

import { getWorkspaceEntitlements } from "@/lib/entitlements/server";
import { getTokenSettings, getTokenUsage, getWallet } from "@/lib/tokens";
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
  const settings = await getTokenSettings(workspaceId);
  const usage = await getTokenUsage(workspaceId);
  const cap = settings.monthly_cap !== null && Number.isFinite(settings.monthly_cap) && settings.monthly_cap > 0
    ? Number(settings.monthly_cap)
    : null;
  const used = usage.used;

  if (balance < costTokens) {
    return { allowed: false, reason: "insufficient_tokens", balance, cap, used };
  }

  if (cap !== null && used + costTokens > cap) {
    return { allowed: false, reason: "cap_exceeded", balance, cap, used };
  }

  return { allowed: true, balance, cap, used };
}
