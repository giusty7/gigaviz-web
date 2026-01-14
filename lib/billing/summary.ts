import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTokenSettings, getTokenUsage, getWallet } from "@/lib/tokens";

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
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    default:
      return "Unknown";
  }
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
  const settings = await getTokenSettings(workspaceId);
  const usage = await getTokenUsage(workspaceId);

  const cap = settings.monthly_cap !== null && Number.isFinite(settings.monthly_cap) && settings.monthly_cap > 0
    ? Number(settings.monthly_cap)
    : null;
  const used = usage.used;
  const remaining = cap !== null ? Math.max(cap - used, 0) : null;
  const percentUsed = cap !== null && cap > 0 ? Math.min(100, (used / cap) * 100) : null;

  const periodStart = formatDateLabel(subscription?.current_period_start);
  const periodEnd = formatDateLabel(subscription?.current_period_end);
  const periodLabel =
    periodStart && periodEnd
      ? `Periode: ${periodStart} - ${periodEnd}`
      : "Period not available yet";

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
      monthly_cap: cap,
      updated_at: settings.updated_at ?? walletRow.updated_at ?? null,
    },
    usage: {
      cap,
      used,
      remaining,
      percentUsed,
      yyyymm: usage.yyyymm || currentYyyymm(),
    },
    statusLabel: mapStatus(subscription?.status),
    periodLabel,
    plans: (plans as BillingPlanRow[] | null) ?? [],
  };
}
