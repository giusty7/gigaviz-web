import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function recordHelperUsage(params: {
  workspaceId: string;
  tokensIn: number;
  tokensOut: number;
  provider: string;
  costEstimate?: number;
}) {
  const { workspaceId, tokensIn, tokensOut, provider, costEstimate = 0 } = params;
  const db = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await db
    .from("helper_usage_daily")
    .select("tokens_in, tokens_out, cost_estimate, provider_breakdown")
    .eq("workspace_id", workspaceId)
    .eq("date", today)
    .maybeSingle();

  const nextTokensIn = (existing?.tokens_in ?? 0) + tokensIn;
  const nextTokensOut = (existing?.tokens_out ?? 0) + tokensOut;
  const nextCost = Number((existing?.cost_estimate ?? 0) + costEstimate);
  const breakdown: Record<string, number> =
    (existing?.provider_breakdown as Record<string, number> | null) ?? {};
  const currentProvider = Number(breakdown[provider] ?? 0);
  breakdown[provider] = currentProvider + tokensOut;

  await db.from("helper_usage_daily").upsert(
    {
      workspace_id: workspaceId,
      date: today,
      tokens_in: nextTokensIn,
      tokens_out: nextTokensOut,
      cost_estimate: nextCost,
      provider_breakdown: breakdown,
    },
    { onConflict: "workspace_id,date" }
  );
}
