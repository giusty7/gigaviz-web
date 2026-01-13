import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWallet } from "@/lib/tokens";

type SettleResult =
  | { ok: true; status: "paid" | "already_paid"; tokens: number; paymentIntentId: string }
  | { ok: false; code: string; message: string };

type SettleOptions = {
  workspaceId?: string;
  provider?: string;
  meta?: Record<string, unknown>;
};

export async function settlePaymentIntentPaid(
  paymentIntentId: string,
  options: SettleOptions = {}
): Promise<SettleResult> {
  const db = supabaseAdmin();
  const { data: intent, error } = await db
    .from("payment_intents")
    .select("id, workspace_id, amount_idr, status, meta")
    .eq("id", paymentIntentId)
    .maybeSingle();

  if (error || !intent) {
    return { ok: false, code: "payment_intent_not_found", message: "Payment intent tidak ditemukan" };
  }

  if (options.workspaceId && intent.workspace_id !== options.workspaceId) {
    return { ok: false, code: "workspace_mismatch", message: "Workspace tidak cocok" };
  }

  const tokens = Number((intent.meta as Record<string, unknown>)?.tokens ?? intent.amount_idr);
  if (intent.status === "paid") {
    return { ok: true, status: "already_paid", tokens, paymentIntentId: intent.id };
  }

  const ref = `payment_intent:${intent.id}`;
  const { data: existingLedger } = await db
    .from("token_ledger")
    .select("id")
    .eq("ref", ref)
    .maybeSingle();

  if (!existingLedger) {
    const wallet = await getWallet(intent.workspace_id);
    const newBalance = Number(wallet.balance_bigint ?? 0) + tokens;
    await db
      .from("token_wallets")
      .update({ balance_bigint: newBalance, updated_at: new Date().toISOString() })
      .eq("workspace_id", intent.workspace_id);

    await db
      .from("token_ledger")
      .upsert(
        {
          workspace_id: intent.workspace_id,
          delta_bigint: tokens,
          reason: "topup",
          type: "topup",
          amount: tokens,
          ref,
          meta: {
            payment_intent_id: intent.id,
            provider: options.provider ?? "manual",
            ...(options.meta ?? {}),
          },
          created_at: new Date().toISOString(),
        },
        { onConflict: "ref" }
      );
  }

  await db
    .from("payment_intents")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", intent.id);

  return { ok: true, status: "paid", tokens, paymentIntentId: intent.id };
}
