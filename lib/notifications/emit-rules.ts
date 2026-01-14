/**
 * Notification emit rules - hooks into various system events to create notifications
 */

import { notifyWorkspaceAdmins, notifyWorkspaceMembers } from "./service";

const ERROR_SPIKE_THRESHOLD = 0.1; // 10% error rate

type EmitContext = {
  workspaceId: string;
  actorUserId?: string;
};

/**
 * Emit notification when token balance is near or at cap
 */
export async function emitTokenCapAlert(
  ctx: EmitContext,
  params: {
    currentBalance: number;
    monthlyCapTokens: number;
    usedPercent: number;
    isHardCap: boolean;
    alertThreshold: number;
  }
) {
  const { currentBalance, monthlyCapTokens, usedPercent, isHardCap, alertThreshold } = params;

  // Only notify if above threshold
  if (usedPercent < alertThreshold) return;

  const isAtCap = usedPercent >= 100;
  const severity = isAtCap && isHardCap ? "critical" : isAtCap ? "warn" : "warn";
  const type = isAtCap && isHardCap ? "token_hard_cap_reached" : "token_near_cap";
  const title = isAtCap
    ? isHardCap
      ? "Token hard cap reached"
      : "Token cap reached"
    : `Token usage at ${Math.round(usedPercent)}%`;
  const body = `Balance: ${currentBalance.toLocaleString()} / ${monthlyCapTokens.toLocaleString()} tokens`;

  // Dedupe per day
  const dedupeKey = `${type}:${new Date().toISOString().slice(0, 10)}`;

  await notifyWorkspaceAdmins({
    workspaceId: ctx.workspaceId,
    type,
    severity,
    title,
    body,
    dedupeKey,
    dedupeWindowMinutes: 60 * 6, // 6 hours
  });
}

/**
 * Emit notification when webhook error rate spikes
 */
export async function emitWebhookErrorSpike(
  ctx: EmitContext,
  params: {
    total24h: number;
    errors24h: number;
    channel: string;
  }
) {
  const { total24h, errors24h, channel } = params;

  if (total24h === 0) return;

  const errorRate = errors24h / total24h;
  if (errorRate < ERROR_SPIKE_THRESHOLD) return;

  const dedupeKey = `webhook_error_spike:${channel}:${new Date().toISOString().slice(0, 10)}`;

  await notifyWorkspaceAdmins({
    workspaceId: ctx.workspaceId,
    type: "webhook_error_spike",
    severity: "critical",
    title: `High webhook error rate (${Math.round(errorRate * 100)}%)`,
    body: `${errors24h} of ${total24h} ${channel} events failed in last 24h`,
    meta: { channel, errorRate, total24h, errors24h },
    dedupeKey,
    dedupeWindowMinutes: 60 * 4, // 4 hours
  });
}

/**
 * Emit notification when a billing request is created
 */
export async function emitBillingRequestCreated(
  ctx: EmitContext,
  params: {
    requestId: string;
    requestType: string;
    amountIdr: number;
    requestedBy: string;
  }
) {
  const { requestId, requestType, amountIdr, requestedBy } = params;

  await notifyWorkspaceAdmins({
    workspaceId: ctx.workspaceId,
    type: "billing_request_created",
    severity: "info",
    title: `New billing request: ${requestType}`,
    body: `Amount: Rp ${amountIdr.toLocaleString("id-ID")}`,
    meta: { requestId, requestType, amountIdr, requestedBy },
    dedupeKey: `billing_request:${requestId}`,
  });
}

/**
 * Emit notification when a topup is requested
 */
export async function emitTopupRequested(
  ctx: EmitContext,
  params: {
    requestId: string;
    tokens: number;
    packageKey: string;
    requestedBy: string;
  }
) {
  const { requestId, tokens, packageKey, requestedBy } = params;

  await notifyWorkspaceAdmins({
    workspaceId: ctx.workspaceId,
    type: "topup_requested",
    severity: "info",
    title: "Token topup requested",
    body: `${tokens.toLocaleString()} tokens (${packageKey})`,
    meta: { requestId, tokens, packageKey, requestedBy },
    dedupeKey: `topup:${requestId}`,
  });
}

/**
 * Emit notification when a topup is posted/activated
 */
export async function emitTopupPosted(
  ctx: EmitContext,
  params: {
    requestId: string;
    tokens: number;
    newBalance: number;
    activatedBy?: string;
  }
) {
  const { requestId, tokens, newBalance } = params;

  // Notify all members when tokens are added
  await notifyWorkspaceMembers({
    workspaceId: ctx.workspaceId,
    type: "topup_posted",
    severity: "info",
    title: "Tokens added to wallet",
    body: `+${tokens.toLocaleString()} tokens. New balance: ${newBalance.toLocaleString()}`,
    meta: { requestId, tokens, newBalance },
    dedupeKey: `topup_posted:${requestId}`,
  });
}

/**
 * Emit notification when template sync fails
 */
export async function emitTemplateSyncFailed(
  ctx: EmitContext,
  params: {
    reason: string;
    wabaId?: string;
  }
) {
  const { reason, wabaId } = params;

  await notifyWorkspaceAdmins({
    workspaceId: ctx.workspaceId,
    type: "template_sync_failed",
    severity: "warn",
    title: "Template sync failed",
    body: reason,
    meta: { wabaId },
    dedupeKey: `template_sync_failed:${new Date().toISOString().slice(0, 13)}`, // Per hour
    dedupeWindowMinutes: 60,
  });
}

/**
 * Emit notification when token connection is missing
 */
export async function emitTokenMissing(ctx: EmitContext, params: { channel: string }) {
  const { channel } = params;

  await notifyWorkspaceAdmins({
    workspaceId: ctx.workspaceId,
    type: "token_missing",
    severity: "warn",
    title: `${channel} connection token missing`,
    body: "Please reconnect your account to restore functionality.",
    meta: { channel },
    dedupeKey: `token_missing:${channel}:${new Date().toISOString().slice(0, 10)}`,
    dedupeWindowMinutes: 60 * 12, // 12 hours
  });
}
