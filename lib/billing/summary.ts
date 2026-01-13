import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWallet } from "@/lib/tokens";

export type BillingPlanRow = {
  code: string;
  name: string;
  type: string | null;
  monthly_price_idr: number | null;
  seat_limit: number | null;
  meta: Record<string, unknown> | null;
  is_active?: boolean | null;
};

export type BillingSummary = {
  subscription: {
    plan_code: string | null;
    status: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    provider: string | null;
    provider_ref: string | null;
  } | null;
  plan: BillingPlanRow | null;
  wallet: {
    balance: number;
    monthly_cap: number | null;
    updated_at: string | null;
  };
  usage: {
    cap: number | null;
    used: number;
    remaining: number | null;
    percentUsed: number | null;
    yyyymm: string;
  };
  statusLabel: string;
  periodLabel: string;
  plans: BillingPlanRow[];
};

function monthStartUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function currentYyyymm(d = new Date()) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatDateLabel(input: string | null | undefined) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapStatus(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "Aktif";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Tertunggak";
    case "canceled":
      return "Dibatalkan";
    default:
      return "Tidak diketahui";
  }
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

export async function getBillingSummary(workspaceId: string): Promise<BillingSummary> {
  const db = supabaseAdmin();

  const { data: subscription } = await db
    .from("subscriptions")
    .select(
      "plan_id, plan_code, status, current_period_start, current_period_end, provider, provider_ref"
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const planCode = subscription?.plan_code ?? subscription?.plan_id ?? "free_locked";

  const { data: planRow } = await db
    .from("plans")
    .select("code, name, type, monthly_price_idr, seat_limit, meta, is_active")
    .eq("code", planCode)
    .maybeSingle();

  const walletRow = await getWallet(workspaceId);
  const { data: walletMeta } = await db
    .from("token_wallets")
    .select("monthly_cap, updated_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const monthStart = monthStartUTC();
  const { data: ledgerRows } = await db
    .from("token_ledger")
    .select("delta_bigint, amount, type")
    .eq("workspace_id", workspaceId)
    .gte("created_at", monthStart.toISOString());

  const used = sumUsage((ledgerRows ?? []) as Array<{ delta_bigint?: number; amount?: number; type?: string }>);
  const capRaw = walletMeta?.monthly_cap ?? null;
  const capValue = capRaw !== null && capRaw !== undefined ? Number(capRaw) : null;
  const normalizedCap =
    capValue !== null && Number.isFinite(capValue) && capValue > 0 ? capValue : null;
  const remaining = normalizedCap !== null ? Math.max(normalizedCap - used, 0) : null;
  const percentUsed =
    normalizedCap !== null && normalizedCap > 0 ? Math.min(100, (used / normalizedCap) * 100) : null;

  const periodStart = formatDateLabel(subscription?.current_period_start);
  const periodEnd = formatDateLabel(subscription?.current_period_end);
  const periodLabel =
    periodStart && periodEnd
      ? `Periode: ${periodStart} - ${periodEnd}`
      : "Periode belum tersedia";

  const { data: plans } = await db
    .from("plans")
    .select("code, name, type, monthly_price_idr, seat_limit, meta, is_active")
    .order("monthly_price_idr", { ascending: true });

  return {
    subscription: subscription
      ? {
          plan_code: subscription.plan_code ?? subscription.plan_id ?? null,
          status: subscription.status ?? null,
          current_period_start: subscription.current_period_start ?? null,
          current_period_end: subscription.current_period_end ?? null,
          provider: subscription.provider ?? null,
          provider_ref: subscription.provider_ref ?? null,
        }
      : null,
    plan: (planRow as BillingPlanRow | null) ?? null,
    wallet: {
      balance: Number(walletRow.balance_bigint ?? 0),
      monthly_cap: normalizedCap,
      updated_at: walletMeta?.updated_at ?? walletRow.updated_at ?? null,
    },
    usage: {
      cap: normalizedCap,
      used,
      remaining,
      percentUsed,
      yyyymm: currentYyyymm(),
    },
    statusLabel: mapStatus(subscription?.status),
    periodLabel,
    plans: (plans as BillingPlanRow[] | null) ?? [],
  };
}
