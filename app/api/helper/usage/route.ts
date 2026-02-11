import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";

export const runtime = "nodejs";

/**
 * GET /api/helper/usage
 * Returns today's token usage and monthly totals for budget tracking.
 */
export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  // Fetch today's usage
  const { data: todayUsage } = await db
    .from("helper_usage_daily")
    .select("tokens_in, tokens_out, cost_estimate, provider_breakdown")
    .eq("workspace_id", workspaceId)
    .eq("date", today)
    .maybeSingle();

  // Fetch monthly totals
  const { data: monthlyData } = await db
    .from("helper_usage_daily")
    .select("tokens_in, tokens_out, cost_estimate")
    .eq("workspace_id", workspaceId)
    .gte("date", monthStart)
    .lte("date", today);

  const monthlyTokensIn = (monthlyData ?? []).reduce((sum, row) => sum + (row.tokens_in ?? 0), 0);
  const monthlyTokensOut = (monthlyData ?? []).reduce((sum, row) => sum + (row.tokens_out ?? 0), 0);
  const monthlyCostEstimate = (monthlyData ?? []).reduce(
    (sum, row) => sum + Number(row.cost_estimate ?? 0),
    0
  );

  // Fetch settings for monthly cap
  const { data: settings } = await db
    .from("helper_settings")
    .select("monthly_cap")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const monthlyCap = Number(settings?.monthly_cap ?? 0);
  const monthlyTotal = monthlyTokensIn + monthlyTokensOut;
  const isOverBudget = monthlyCap > 0 && monthlyTotal >= monthlyCap;

  return withCookies(
    NextResponse.json({
      ok: true,
      today: {
        tokensIn: todayUsage?.tokens_in ?? 0,
        tokensOut: todayUsage?.tokens_out ?? 0,
        total: (todayUsage?.tokens_in ?? 0) + (todayUsage?.tokens_out ?? 0),
        costEstimate: Number(todayUsage?.cost_estimate ?? 0),
        providerBreakdown: todayUsage?.provider_breakdown ?? {},
      },
      monthly: {
        tokensIn: monthlyTokensIn,
        tokensOut: monthlyTokensOut,
        total: monthlyTotal,
        costEstimate: monthlyCostEstimate,
        cap: monthlyCap,
        isOverBudget,
      },
    })
  );
}
