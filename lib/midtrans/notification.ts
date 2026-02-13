import "server-only";

/* ------------------------------------------------------------------ */
/* Midtrans Notification Handler                                       */
/*                                                                     */
/* Processes payment notifications from Midtrans webhook.             */
/* Handles both subscription payments and token top-ups.              */
/* ------------------------------------------------------------------ */

import {
  getTransactionStatus,
  verifySignature,
  type MidtransNotificationPayload,
} from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { seedWorkspaceQuotas } from "@/lib/quotas";
import { settlePaymentIntentPaid } from "@/lib/billing/topup";

/* ── Public handler ──────────────────────────────────────────────── */

export type NotificationResult = {
  status: string;
  action?: string;
  message?: string;
};

export async function handleMidtransNotification(
  payload: MidtransNotificationPayload
): Promise<NotificationResult> {
  const { order_id, status_code, gross_amount, signature_key } = payload;

  // 1. Verify signature
  if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
    logger.error("[midtrans-notification] Invalid signature", { order_id });
    throw new Error("Invalid notification signature");
  }

  // 2. Double-check with Midtrans server (server-to-server verification)
  let serverStatus;
  try {
    serverStatus = await getTransactionStatus(order_id);
  } catch (err) {
    logger.error("[midtrans-notification] Failed to verify with Midtrans API", {
      order_id,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new Error("Failed to verify transaction status");
  }

  const txStatus = serverStatus.transaction_status;
  const fraudStatus = serverStatus.fraud_status;

  // 3. Map to internal status
  const isSuccess =
    (txStatus === "capture" && fraudStatus === "accept") ||
    txStatus === "settlement";
  const isPending = txStatus === "pending";
  const isExpired = txStatus === "expire";
  const isDenied = txStatus === "deny" || txStatus === "cancel";

  const internalStatus = isSuccess
    ? "paid"
    : isPending
      ? "pending"
      : isExpired
        ? "expired"
        : isDenied
          ? "failed"
          : "pending";

  const db = supabaseAdmin();

  // 4. Store raw event for audit
  try {
    await db.from("payment_events").insert({
      provider: "midtrans",
      provider_event_id: serverStatus.transaction_id,
      payload: serverStatus,
      received_at: new Date().toISOString(),
    });
  } catch {
    /* ignore duplicate */
  }

  // 5. Update payment_intents status
  await db
    .from("payment_intents")
    .update({
      status: internalStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_ref", order_id)
    .eq("provider", "midtrans");

  // 6. If not successful, log and return
  if (!isSuccess) {
    logger.info("[midtrans-notification] Non-success status", {
      order_id,
      txStatus,
      fraudStatus,
      internalStatus,
    });
    return { status: internalStatus };
  }

  // 7. Fetch payment intent to determine action
  const { data: intent } = await db
    .from("payment_intents")
    .select("id, workspace_id, kind, amount_idr, meta")
    .eq("provider_ref", order_id)
    .eq("provider", "midtrans")
    .maybeSingle();

  if (!intent) {
    logger.error("[midtrans-notification] Payment intent not found", { order_id });
    return { status: "error", message: "Payment intent not found for order" };
  }

  const metadata = (intent.meta ?? {}) as Record<string, unknown>;

  // 8. Route to appropriate handler
  if (intent.kind === "topup" || metadata?.type === "token_topup") {
    return handleTokenTopup(intent.id, intent.workspace_id, metadata);
  }

  if (intent.kind === "subscription" || metadata?.plan_code) {
    return handleSubscriptionPayment(intent.workspace_id, order_id, metadata);
  }

  logger.warn("[midtrans-notification] Unknown payment intent type", {
    order_id,
    kind: intent.kind,
  });
  return { status: "paid", message: "Unknown intent type — marked as paid" };
}

/* ── Subscription handler ────────────────────────────────────────── */

async function handleSubscriptionPayment(
  workspaceId: string,
  orderId: string,
  metadata: Record<string, unknown>
): Promise<NotificationResult> {
  const db = supabaseAdmin();
  const planCode = metadata.plan_code as string;
  const interval = (metadata.interval as string) ?? "monthly";
  const isRenewal = metadata.is_renewal === true;

  if (!planCode) {
    logger.error("[midtrans-notification] Missing plan_code in metadata", {
      orderId,
    });
    return { status: "error", message: "Missing plan_code" };
  }

  const now = new Date();
  const periodMonths = interval === "yearly" ? 12 : 1;
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + periodMonths);

  const seatLimits: Record<string, number> = {
    free: 1,
    starter: 3,
    growth: 10,
    business: 25,
    enterprise: 999,
  };

  if (isRenewal) {
    // Extend existing subscription
    await db
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("workspace_id", workspaceId)
      .eq("plan_id", planCode);

    logger.info("[midtrans-notification] Subscription renewed", {
      workspaceId,
      planCode,
      periodEnd: periodEnd.toISOString(),
    });
  } else {
    // Create or update subscription
    await db.from("subscriptions").upsert(
      {
        workspace_id: workspaceId,
        plan_id: planCode,
        plan_code: planCode,
        status: "active",
        billing_mode: (seatLimits[planCode] ?? 1) > 3 ? "team" : "individual",
        seat_limit: seatLimits[planCode] ?? 1,
        provider: "midtrans",
        provider_ref: orderId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "workspace_id" }
    );

    // Seed quotas for the new plan
    await seedWorkspaceQuotas(workspaceId, planCode);

    logger.info("[midtrans-notification] Subscription activated", {
      workspaceId,
      planCode,
      orderId,
    });
  }

  return {
    status: "paid",
    action: isRenewal ? "subscription_renewed" : "subscription_activated",
  };
}

/* ── Token top-up handler ────────────────────────────────────────── */

async function handleTokenTopup(
  paymentIntentId: string,
  workspaceId: string,
  metadata: Record<string, unknown>
): Promise<NotificationResult> {
  const tokenAmount = Number(metadata.token_amount) || 0;

  if (tokenAmount <= 0) {
    logger.error("[midtrans-notification] Invalid token amount", {
      paymentIntentId,
      tokenAmount,
    });
    return { status: "error", message: "Invalid token amount" };
  }

  // Use the existing settlement function (idempotent)
  const result = await settlePaymentIntentPaid(paymentIntentId, {
    provider: "midtrans",
    meta: { ...metadata, token_amount: tokenAmount },
  });

  if (!result.ok) {
    logger.error("[midtrans-notification] Token settlement failed", {
      paymentIntentId,
      code: result.code,
    });
    return { status: "error", message: result.message };
  }

  logger.info("[midtrans-notification] Tokens credited", {
    paymentIntentId,
    workspaceId,
    tokens: result.tokens,
    status: result.status,
  });

  return {
    status: "paid",
    action: result.status === "already_paid" ? "already_credited" : "tokens_credited",
  };
}
