import "server-only";

/* ------------------------------------------------------------------ */
/* Xendit Webhook Handler                                              */
/*                                                                     */
/* Processes payment notifications from Xendit invoice webhook.       */
/* Handles both subscription payments and token top-ups.              */
/* ------------------------------------------------------------------ */

import { getInvoiceStatus, type XenditWebhookPayload } from "./client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { seedWorkspaceQuotas } from "@/lib/quotas";
import { settlePaymentIntentPaid } from "@/lib/billing/topup";
import { sendBillingEmail } from "@/lib/billing/emails";

/* ── Public handler ──────────────────────────────────────────────── */

export type WebhookResult = {
  status: string;
  action?: string;
  message?: string;
};

export async function handleXenditWebhookEvent(
  payload: XenditWebhookPayload
): Promise<WebhookResult> {
  const { id: invoiceId, external_id: orderId, status } = payload;

  // 1. Server-to-server verification — double-check status with Xendit
  let serverInvoice;
  try {
    serverInvoice = await getInvoiceStatus(invoiceId);
  } catch (err) {
    logger.error("[xendit-webhook] Failed to verify with Xendit API", {
      invoiceId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new Error("Failed to verify invoice status");
  }

  const verifiedStatus = serverInvoice.status;

  const db = supabaseAdmin();

  // 2. Store raw event for audit (idempotent via provider_event_id)
  try {
    await db.from("payment_events").insert({
      provider: "xendit",
      provider_event_id: invoiceId,
      payload: payload as unknown as Record<string, unknown>,
      received_at: new Date().toISOString(),
    });
  } catch {
    /* ignore duplicate */
  }

  // 3. Map to internal status
  const internalStatus =
    verifiedStatus === "PAID" || verifiedStatus === "SETTLED"
      ? "paid"
      : verifiedStatus === "EXPIRED"
        ? "expired"
        : "pending";

  // 4. Update payment_intents status
  await db
    .from("payment_intents")
    .update({
      status: internalStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_ref", orderId)
    .eq("provider", "xendit");

  // 5. If not successful, log and return
  if (internalStatus !== "paid") {
    logger.info("[xendit-webhook] Non-success status", {
      invoiceId,
      orderId,
      status,
      verifiedStatus,
      internalStatus,
    });
    return { status: internalStatus };
  }

  // 6. Fetch payment intent to determine action
  const { data: intent } = await db
    .from("payment_intents")
    .select("id, workspace_id, kind, amount_idr, meta")
    .eq("provider_ref", orderId)
    .eq("provider", "xendit")
    .maybeSingle();

  if (!intent) {
    logger.error("[xendit-webhook] Payment intent not found", { orderId });
    return { status: "error", message: "Payment intent not found for order" };
  }

  const metadata = (intent.meta ?? {}) as Record<string, unknown>;

  // Use metadata from the webhook if available (Xendit sends it back)
  const webhookMeta = payload.metadata ?? {};

  // 7. Route to appropriate handler
  if (
    intent.kind === "topup" ||
    metadata?.type === "token_topup" ||
    webhookMeta.kind === "topup"
  ) {
    return handleTokenTopup(intent.id, intent.workspace_id, metadata);
  }

  if (
    intent.kind === "subscription" ||
    metadata?.plan_code ||
    webhookMeta.kind === "subscription"
  ) {
    return handleSubscriptionPayment(intent.workspace_id, orderId, metadata);
  }

  logger.warn("[xendit-webhook] Unknown payment intent type", {
    orderId,
    kind: intent.kind,
  });
  return { status: "paid", message: "Unknown intent type — marked as paid" };
}

/* ── Subscription handler ────────────────────────────────────────── */

async function handleSubscriptionPayment(
  workspaceId: string,
  orderId: string,
  metadata: Record<string, unknown>
): Promise<WebhookResult> {
  const db = supabaseAdmin();
  const planCode = metadata.plan_code as string;
  const interval = (metadata.interval as string) ?? "monthly";
  const isRenewal = metadata.is_renewal === true || metadata.is_renewal === "true";

  if (!planCode) {
    logger.error("[xendit-webhook] Missing plan_code in metadata", { orderId });
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

    logger.info("[xendit-webhook] Subscription renewed", {
      workspaceId,
      planCode,
      periodEnd: periodEnd.toISOString(),
    });
  } else {
    await db.from("subscriptions").upsert(
      {
        workspace_id: workspaceId,
        plan_id: planCode,
        plan_code: planCode,
        status: "active",
        billing_mode: (seatLimits[planCode] ?? 1) > 3 ? "team" : "individual",
        seat_limit: seatLimits[planCode] ?? 1,
        provider: "xendit",
        provider_ref: orderId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      },
      { onConflict: "workspace_id" }
    );

    await seedWorkspaceQuotas(workspaceId, planCode);

    logger.info("[xendit-webhook] Subscription activated", {
      workspaceId,
      planCode,
      orderId,
    });
  }

  // Send email (best effort)
  try {
    const ownerEmail = await getWorkspaceOwnerEmail(db, workspaceId);
    if (ownerEmail) {
      await sendBillingEmail({
        to: ownerEmail.email,
        type: isRenewal ? "subscription_renewed" : "subscription_activated",
        data: {
          workspaceName: ownerEmail.workspaceName,
          planName: planCode,
        },
      });
    }
  } catch {
    // Don't fail webhook for email errors
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
): Promise<WebhookResult> {
  const tokenAmount = Number(metadata.token_amount) || 0;

  if (tokenAmount <= 0) {
    logger.error("[xendit-webhook] Invalid token amount", {
      paymentIntentId,
      tokenAmount,
    });
    return { status: "error", message: "Invalid token amount" };
  }

  const result = await settlePaymentIntentPaid(paymentIntentId, {
    provider: "xendit",
    meta: { ...metadata, token_amount: tokenAmount },
  });

  if (!result.ok) {
    logger.error("[xendit-webhook] Token settlement failed", {
      paymentIntentId,
      code: result.code,
    });
    return { status: "error", message: result.message };
  }

  logger.info("[xendit-webhook] Tokens credited", {
    paymentIntentId,
    workspaceId,
    tokens: result.tokens,
    status: result.status,
  });

  // Send email (best effort)
  if (result.status !== "already_paid") {
    try {
      const db = supabaseAdmin();
      const ownerEmail = await getWorkspaceOwnerEmail(db, workspaceId);
      if (ownerEmail) {
        await sendBillingEmail({
          to: ownerEmail.email,
          type: "topup_success",
          data: {
            workspaceName: ownerEmail.workspaceName,
            tokens: result.tokens,
          },
        });
      }
    } catch {
      // Don't fail webhook for email errors
    }
  }

  return {
    status: "paid",
    action: "tokens_credited",
    message: `${result.tokens} tokens credited`,
  };
}

/* ── Helpers ──────────────────────────────────────────────────────── */

async function getWorkspaceOwnerEmail(
  db: ReturnType<typeof supabaseAdmin>,
  workspaceId: string
): Promise<{ email: string; workspaceName: string } | null> {
  const { data: workspace } = await db
    .from("workspaces")
    .select("name, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace?.owner_id) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("email")
    .eq("id", workspace.owner_id)
    .maybeSingle();

  if (!profile?.email) return null;

  return { email: profile.email, workspaceName: workspace.name ?? "Workspace" };
}
