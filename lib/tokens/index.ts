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

export type TokenSettings = {
  monthly_cap: number | null;
  alert_threshold: number;
  hard_cap: boolean;
  updated_at: string | null;
};

export type TokenOverview = {
  balance: number;
  cap: number | null;
  used: number;
  remaining: number | null;
  percentUsed: number | null;
  yyyymm: string;
  dailyUsage: Array<{ day: string; tokens: number }>;
  alertThreshold: number;
  hardCap: boolean;
  status: "normal" | "warning" | "critical";
};

export type TokenLedgerRow = {
  id: string;
  workspace_id: string;
  tokens: number;
  delta_bigint: number;
  entry_type: string;
  status: string;
  reason: string;
  feature_key: string | null;
  ref_type: string | null;
  ref_id: string | null;
  ref_table: string | null;
  note: string | null;
  meta?: Record<string, unknown> | null;
  created_by: string | null;
  user_id: string | null;
  created_at: string;
};

function normalizeCap(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(Number(value))) return null;
  const num = Number(value);
  return num > 0 ? num : null;
}

function getMonthRange(input?: string | null) {
  const now = new Date();
  const match = typeof input === "string" && input.length >= 6 ? input : null;
  const year = match ? Number(match.slice(0, 4)) : now.getUTCFullYear();
  const monthIdx = match ? Number(match.slice(4, 6)) - 1 : now.getUTCMonth();
  const safeYear = Number.isFinite(year) ? year : now.getUTCFullYear();
  const safeMonth = Number.isFinite(monthIdx) ? Math.min(Math.max(monthIdx, 0), 11) : now.getUTCMonth();
  const start = new Date(Date.UTC(safeYear, safeMonth, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(safeYear, safeMonth + 1, 1, 0, 0, 0, 0));
  const label = `${safeYear}${String(safeMonth + 1).padStart(2, "0")}`;
  return { start, end, label };
}

function sumUsage(rows: Array<{ tokens?: number | null; delta_bigint?: number | null; entry_type?: string | null }>) {
  return rows.reduce((total, row) => {
    const amount = Number(row.tokens ?? row.delta_bigint ?? 0);
    const value = amount < 0 ? Math.abs(amount) : amount;
    if ((row.entry_type || "").toLowerCase() === "spend") {
      return total + value;
    }
    return total;
  }, 0);
}

export async function getTokenSettings(workspaceId: string): Promise<TokenSettings> {
  const db = supabaseAdmin();
  const { data: settings } = await db
    .from("token_settings")
    .select("monthly_cap, alert_threshold, hard_cap, updated_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (settings) {
    return {
      monthly_cap: normalizeCap(settings.monthly_cap),
      alert_threshold: Number(settings.alert_threshold ?? 80),
      hard_cap: Boolean(settings.hard_cap),
      updated_at: settings.updated_at ?? null,
    };
  }

  const { data: wallet } = await db
    .from("token_wallets")
    .select("monthly_cap, updated_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return {
    monthly_cap: normalizeCap(wallet?.monthly_cap),
    alert_threshold: 80,
    hard_cap: false,
    updated_at: wallet?.updated_at ?? null,
  };
}

export async function upsertTokenSettings(
  workspaceId: string,
  input: Partial<Pick<TokenSettings, "monthly_cap" | "alert_threshold" | "hard_cap">>
) {
  const db = supabaseAdmin();
  const monthlyCap = normalizeCap(input.monthly_cap ?? null);
  const alertThreshold = input.alert_threshold ?? 80;
  const hardCap = input.hard_cap ?? false;
  const timestamp = new Date().toISOString();

  const { error } = await db.from("token_settings").upsert({
    workspace_id: workspaceId,
    monthly_cap: monthlyCap,
    alert_threshold: alertThreshold,
    hard_cap: hardCap,
    updated_at: timestamp,
  });

  if (error) throw error;

  await db
    .from("token_wallets")
    .update({ monthly_cap: monthlyCap, updated_at: timestamp })
    .eq("workspace_id", workspaceId);

  return { monthly_cap: monthlyCap, alert_threshold: alertThreshold, hard_cap: hardCap };
}

export async function getTokenUsage(
  workspaceId: string,
  yyyymm?: string | null
) {
  const db = supabaseAdmin();
  const { start, end, label } = getMonthRange(yyyymm);

  const { data: rows } = await db
    .from("token_ledger")
    .select("tokens, delta_bigint, entry_type, status, created_at")
    .eq("workspace_id", workspaceId)
    .eq("status", "posted")
    .eq("entry_type", "spend")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  const usageRows = (rows ?? []) as Array<{
    tokens: number | null;
    delta_bigint: number | null;
    entry_type: string | null;
    status: string | null;
    created_at: string;
  }>;

  const used = sumUsage(usageRows);

  const dailyMap = new Map<string, number>();
  usageRows.forEach((row) => {
    const d = new Date(row.created_at);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const value = Math.abs(Number(row.tokens ?? row.delta_bigint ?? 0));
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + value);
  });

  const dailyUsage = Array.from(dailyMap.entries()).map(([day, tokens]) => ({ day, tokens }));

  return {
    used,
    dailyUsage,
    yyyymm: label,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

export async function getTokenOverview(
  workspaceId: string,
  yyyymm?: string | null
): Promise<TokenOverview> {
  const settings = await getTokenSettings(workspaceId);
  const usage = await getTokenUsage(workspaceId, yyyymm);
  const wallet = await getWallet(workspaceId);

  const cap = normalizeCap(settings.monthly_cap);
  const remaining = cap !== null ? Math.max(cap - usage.used, 0) : null;
  const percentUsed = cap !== null && cap > 0 ? Math.min(100, (usage.used / cap) * 100) : null;

  const status: TokenOverview["status"] =
    cap === null
      ? "normal"
      : percentUsed !== null && percentUsed >= 100
        ? "critical"
        : percentUsed !== null && percentUsed >= settings.alert_threshold
          ? "warning"
          : "normal";

  return {
    balance: Number(wallet.balance_bigint ?? 0),
    cap,
    used: usage.used,
    remaining,
    percentUsed,
    yyyymm: usage.yyyymm,
    dailyUsage: usage.dailyUsage,
    alertThreshold: settings.alert_threshold,
    hardCap: settings.hard_cap,
    status,
  };
}

/**
 * Welcome token grants per plan tier.
 * Seeded automatically on first wallet creation.
 */
const WELCOME_TOKENS: Record<string, number> = {
  free: 500,
  starter: 5_000,
  growth: 25_000,
  business: 50_000,
  enterprise: 100_000,
  // Legacy plans
  free_locked: 500,
  ind_starter: 5_000,
  ind_pro: 25_000,
  team_starter: 25_000,
  team_pro: 50_000,
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

  // Determine plan to seed welcome tokens
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const planId = sub?.plan_id || "free";
  const welcomeAmount = WELCOME_TOKENS[planId] ?? 500;

  const { data: created, error: createErr } = await db
    .from("token_wallets")
    .insert({ workspace_id: workspaceId, balance_bigint: welcomeAmount })
    .select("workspace_id, balance_bigint, updated_at")
    .single();

  if (createErr) throw createErr;

  // Record the welcome grant in the ledger (best effort)
  try {
    await db.from("token_ledger").insert({
      workspace_id: workspaceId,
      tokens: welcomeAmount,
      delta_bigint: welcomeAmount,
      entry_type: "grant",
      status: "completed",
      reason: "welcome_tokens",
      note: `Welcome tokens: ${welcomeAmount} tokens (plan: ${planId})`,
    });
  } catch {
    // best effort — don't fail wallet creation if ledger insert fails
  }

  return created;
}

export async function listTokenLedger(
  workspaceId: string,
  options: {
    page?: number;
    pageSize?: number;
    type?: string | null;
    status?: string | null;
    from?: string | null;
    to?: string | null;
  } = {}
) {
  const page = Math.max(options.page ?? 1, 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 200);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const db = supabaseAdmin();
  let query = db
    .from("token_ledger")
    .select(
      "id, workspace_id, tokens, delta_bigint, entry_type, status, reason, feature_key, ref_type, ref_id, ref_table, note, meta, created_by, user_id, created_at",
      { count: "exact" }
    )
    .eq("workspace_id", workspaceId);

  if (options.type) {
    query = query.eq("entry_type", options.type);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.from) {
    query = query.gte("created_at", options.from);
  }
  if (options.to) {
    query = query.lte("created_at", options.to);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const rows = (data ?? []) as TokenLedgerRow[];

  return {
    rows,
    page,
    pageSize,
    total: count ?? rows.length,
  };
}

export async function getLedger(
  workspaceId: string,
  options: { page?: number; pageSize?: number; type?: string | null; status?: string | null; from?: string | null; to?: string | null } = {}
) {
  const result = await listTokenLedger(workspaceId, options);
  return result.rows;
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

  // Record metric for dashboard trend
  try {
    const { incrementQuotaUsage, recordMetric } = await import("@/lib/quotas");
    await incrementQuotaUsage(workspaceId, "ai_tokens_monthly", cost);
    await recordMetric(workspaceId, "ai_tokens_consumed", cost, { feature_key: metadata.feature_key });
  } catch {
    // Best effort - don't fail token consumption if metrics fail
  }

  return data;
}

export async function createTopupRequest(input: {
  workspaceId: string;
  userId: string;
  packageKey: string;
  tokens: number;
  notes?: string | null;
}) {
  const db = supabaseAdmin();
  const { data: request, error } = await db
    .from("token_topup_requests")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      package_key: input.packageKey,
      tokens: input.tokens,
      notes: input.notes ?? null,
    })
    .select("id, workspace_id, user_id, package_key, tokens, notes, status, created_at, updated_at")
    .single();

  if (error) throw error;

  await db.from("token_ledger").insert({
    workspace_id: input.workspaceId,
    user_id: input.userId,
    tokens: input.tokens,
    delta_bigint: 0,
    entry_type: "topup",
    status: "pending",
    reason: "topup_request",
    ref_table: "token_topup_requests",
    ref_id: request.id,
    note: input.notes ?? null,
    created_by: input.userId,
  });

  return request;
}

export async function activateTopupRequest(
  workspaceId: string,
  requestId: string,
  actorUserId?: string | null
) {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("process_token_topup", {
    p_workspace_id: workspaceId,
    p_request_id: requestId,
    p_actor: actorUserId ?? null,
  });

  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  return {
    balance: Number(result?.new_balance ?? 0),
    ledger_id: result?.ledger_id ?? null,
  };
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
