import "server-only";
import { logger } from "@/lib/logging";

/**
 * Ops Alert System
 * 
 * Sends platform-level alerts to external channels (Slack, Discord, generic webhook).
 * Configure via environment variables:
 *   OPS_SLACK_WEBHOOK_URL    – Slack incoming webhook URL
 *   OPS_DISCORD_WEBHOOK_URL  – Discord webhook URL
 *   OPS_ALERT_WEBHOOK_URL    – Generic webhook (fallback)
 * 
 * If no webhooks are configured, alerts are logged but not sent externally.
 */

type AlertSeverity = "info" | "warning" | "critical";

interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  /** Additional context fields */
  fields?: Record<string, string>;
  /** Source module / subsystem */
  source?: string;
}

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info: "#2196F3",
  warning: "#FF9800",
  critical: "#F44336",
};

const SEVERITY_DISCORD_COLOR: Record<AlertSeverity, number> = {
  info: 0x2196f3,
  warning: 0xff9800,
  critical: 0xf44336,
};

// ──────────────────────────────────────────────────────
// Slack
// ──────────────────────────────────────────────────────

function buildSlackPayload(alert: AlertPayload) {
  const fields = alert.fields
    ? Object.entries(alert.fields).map(([k, v]) => ({
        type: "mrkdwn",
        text: `*${k}:*\n${v}`,
      }))
    : [];

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${SEVERITY_EMOJI[alert.severity]} ${alert.title}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: alert.message,
        },
      },
      ...(fields.length > 0
        ? [{ type: "section", fields }]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Source:* ${alert.source ?? "Gigaviz Ops"} | *Time:* ${new Date().toISOString()}`,
          },
        ],
      },
    ],
    attachments: [
      {
        color: SEVERITY_COLOR[alert.severity],
        fallback: `${SEVERITY_EMOJI[alert.severity]} ${alert.title}: ${alert.message}`,
      },
    ],
  };
}

async function sendSlack(webhookUrl: string, alert: AlertPayload): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackPayload(alert)),
    });
    if (!res.ok) {
      logger.error("[ops-alert] Slack webhook failed", {
        status: res.status,
        body: await res.text().catch(() => ""),
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("[ops-alert] Slack webhook error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

// ──────────────────────────────────────────────────────
// Discord
// ──────────────────────────────────────────────────────

function buildDiscordPayload(alert: AlertPayload) {
  const fields = alert.fields
    ? Object.entries(alert.fields).map(([name, value]) => ({
        name,
        value,
        inline: true,
      }))
    : [];

  return {
    embeds: [
      {
        title: `${SEVERITY_EMOJI[alert.severity]} ${alert.title}`,
        description: alert.message,
        color: SEVERITY_DISCORD_COLOR[alert.severity],
        fields,
        footer: {
          text: `${alert.source ?? "Gigaviz Ops"} | ${new Date().toISOString()}`,
        },
      },
    ],
  };
}

async function sendDiscord(webhookUrl: string, alert: AlertPayload): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildDiscordPayload(alert)),
    });
    if (!res.ok) {
      logger.error("[ops-alert] Discord webhook failed", {
        status: res.status,
        body: await res.text().catch(() => ""),
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("[ops-alert] Discord webhook error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

// ──────────────────────────────────────────────────────
// Generic Webhook
// ──────────────────────────────────────────────────────

async function sendGenericWebhook(webhookUrl: string, alert: AlertPayload): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...alert,
        timestamp: new Date().toISOString(),
        platform: "gigaviz",
      }),
    });
    if (!res.ok) {
      logger.error("[ops-alert] Generic webhook failed", { status: res.status });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("[ops-alert] Generic webhook error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

// ──────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────

/**
 * Send an ops alert to all configured channels.
 * Non-blocking — failures are logged but never throw.
 */
export async function sendOpsAlert(alert: AlertPayload): Promise<void> {
  const slackUrl = process.env.OPS_SLACK_WEBHOOK_URL;
  const discordUrl = process.env.OPS_DISCORD_WEBHOOK_URL;
  const genericUrl = process.env.OPS_ALERT_WEBHOOK_URL;

  // Always log locally
  const logFn = alert.severity === "critical" ? logger.error : alert.severity === "warning" ? logger.warn : logger.info;
  logFn(`[ops-alert] ${alert.title}`, {
    message: alert.message,
    severity: alert.severity,
    source: alert.source,
    ...alert.fields,
  });

  // Send to all configured channels in parallel
  const promises: Promise<boolean>[] = [];

  if (slackUrl) promises.push(sendSlack(slackUrl, alert));
  if (discordUrl) promises.push(sendDiscord(discordUrl, alert));
  if (genericUrl) promises.push(sendGenericWebhook(genericUrl, alert));

  if (promises.length === 0) {
    logger.dev("[ops-alert] No external webhook configured — alert logged only");
    return;
  }

  await Promise.allSettled(promises);
}

// ──────────────────────────────────────────────────────
// Pre-built Alert Templates
// ──────────────────────────────────────────────────────

/** Health check degraded or unhealthy */
export async function alertHealthDegraded(details: {
  status: string;
  failedChecks: string[];
}) {
  await sendOpsAlert({
    title: "System Health Degraded",
    message: `Overall status: *${details.status}*\nFailing checks: ${details.failedChecks.join(", ") || "none"}`,
    severity: details.status === "unhealthy" ? "critical" : "warning",
    source: "Health Monitor",
    fields: {
      Status: details.status,
      "Failed Checks": details.failedChecks.join(", ") || "—",
    },
  });
}

/** Worker stale / heartbeat missed */
export async function alertWorkerStale(details: {
  workerName: string;
  lastSeen: string;
  threshold: string;
}) {
  await sendOpsAlert({
    title: "Worker Heartbeat Missing",
    message: `Worker *${details.workerName}* has not sent a heartbeat since ${details.lastSeen}.`,
    severity: "critical",
    source: "Worker Monitor",
    fields: {
      Worker: details.workerName,
      "Last Seen": details.lastSeen,
      Threshold: details.threshold,
    },
  });
}

/** Workspace suspended */
export async function alertWorkspaceSuspended(details: {
  workspaceId: string;
  workspaceName: string;
  reason: string;
  actorEmail: string;
}) {
  await sendOpsAlert({
    title: "Workspace Suspended",
    message: `Workspace *${details.workspaceName}* has been suspended by ${details.actorEmail}.`,
    severity: "warning",
    source: "Ops Console",
    fields: {
      Workspace: details.workspaceName,
      "Workspace ID": details.workspaceId,
      Reason: details.reason,
      "Suspended By": details.actorEmail,
    },
  });
}

/** Ticket SLA breach */
export async function alertTicketSlaBreach(details: {
  ticketId: string;
  subject: string;
  slaType: string;
  elapsedHours: number;
}) {
  await sendOpsAlert({
    title: "Ticket SLA Breach",
    message: `Ticket *${details.subject}* has breached its ${details.slaType} SLA after ${details.elapsedHours}h.`,
    severity: "critical",
    source: "Support",
    fields: {
      "Ticket ID": details.ticketId,
      Subject: details.subject,
      "SLA Type": details.slaType,
      Elapsed: `${details.elapsedHours} hours`,
    },
  });
}

/** Impersonation started */
export async function alertImpersonationStarted(details: {
  actorEmail: string;
  targetEmail: string;
  workspaceName: string;
  reason: string;
  durationMinutes: number;
}) {
  await sendOpsAlert({
    title: "Impersonation Session Started",
    message: `*${details.actorEmail}* started impersonating *${details.targetEmail}* in workspace *${details.workspaceName}*.`,
    severity: "warning",
    source: "Ops Security",
    fields: {
      Actor: details.actorEmail,
      Target: details.targetEmail,
      Workspace: details.workspaceName,
      Reason: details.reason,
      Duration: `${details.durationMinutes} min`,
    },
  });
}

/** High error rate detected */
export async function alertHighErrorRate(details: {
  endpoint: string;
  errorRate: number;
  sampleWindow: string;
}) {
  await sendOpsAlert({
    title: "High Error Rate Detected",
    message: `Endpoint *${details.endpoint}* has a ${details.errorRate}% error rate over the last ${details.sampleWindow}.`,
    severity: details.errorRate > 50 ? "critical" : "warning",
    source: "API Monitor",
    fields: {
      Endpoint: details.endpoint,
      "Error Rate": `${details.errorRate}%`,
      Window: details.sampleWindow,
    },
  });
}
