import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlanMeta, type PlanId } from "@/lib/entitlements";

export type BillingInfo = {
  subscription: {
    plan_id: string | null;
    status: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    billing_mode: string | null;
    seat_limit: number | null;
  } | null;
  plan:
    | {
        code: string;
        name: string;
        price_cents: number;
        currency: string;
        is_active: boolean;
      }
    | null;
  periodLabel: string;
  statusLabel: string;
};

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

export async function getWorkspaceBilling(workspaceId: string): Promise<BillingInfo> {
  const db = supabaseAdmin();

  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id, status, current_period_start, current_period_end, billing_mode, seat_limit")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const planId = subscription?.plan_id ?? "free_locked";

  const { data: planRow } = await db
    .from("plans")
    .select("code, name, price_cents, currency, is_active")
    .eq("code", planId)
    .maybeSingle();

  const periodStart = formatDateLabel(subscription?.current_period_start);
  const periodEnd = formatDateLabel(subscription?.current_period_end);
  const periodLabel =
    periodStart && periodEnd
      ? `Periode: ${periodStart} – ${periodEnd}`
      : "Period not available yet";

  return {
    subscription: subscription
      ? {
          plan_id: subscription.plan_id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          billing_mode: subscription.billing_mode,
          seat_limit: subscription.seat_limit,
        }
      : null,
    plan: planRow ?? null,
    periodLabel,
    statusLabel: mapStatus(subscription?.status),
  };
}

export function normalizePlanId(code: string | null | undefined): PlanId {
  const known = getPlanMeta(code)?.plan_id;
  return known ?? "free_locked";
}
