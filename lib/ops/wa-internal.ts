import "server-only";

import { sendWhatsAppText } from "@/lib/wa/cloud";
import { logger } from "@/lib/logging";
import { sendOpsAlert } from "@/lib/ops/alerts";

/**
 * Internal WhatsApp notification system for Gigaviz Ops
 *
 * Sends WA messages to ops/admin team for important events.
 * Uses WA_ADMIN_PHONE from env as the default recipient.
 * All sends are fire-and-forget (non-blocking) to avoid disrupting flows.
 */

const OPS_PHONE = process.env.WA_ADMIN_PHONE;

interface NotifyResult {
  ok: boolean;
  channel: "whatsapp" | "alert-fallback" | "skipped";
  error?: string;
}

/**
 * Send a WhatsApp message to the ops admin phone.
 * Falls back to ops alert (Slack/Discord) if WA is not configured.
 */
async function sendOpsWa(message: string, context: string): Promise<NotifyResult> {
  if (!OPS_PHONE) {
    logger.info(`[OPS-WA] WA_ADMIN_PHONE not set — falling back to ops alert for: ${context}`);
    try {
      await sendOpsAlert({
        title: `[Internal] ${context}`,
        message,
        severity: "info",
      });
      return { ok: true, channel: "alert-fallback" };
    } catch (e) {
      logger.warn("[OPS-WA] Ops alert fallback also failed", { error: e });
      return { ok: false, channel: "alert-fallback", error: String(e) };
    }
  }

  try {
    await sendWhatsAppText({ to: OPS_PHONE, body: message });
    logger.info(`[OPS-WA] Sent: ${context}`);
    return { ok: true, channel: "whatsapp" };
  } catch (e) {
    logger.warn(`[OPS-WA] WA send failed for: ${context}`, { error: e });
    // Fallback to ops alert (Slack/Discord)
    try {
      await sendOpsAlert({ title: `[Internal] ${context}`, message, severity: "info" });
      return { ok: true, channel: "alert-fallback" };
    } catch (alertErr) {
      logger.error(`[OPS-WA] All notification channels failed for: ${context}`, { error: alertErr });
      return { ok: false, channel: "whatsapp", error: String(e) };
    }
  }
}

/* ────── Pre-built notification templates ────── */

/**
 * Notify ops when a new lead arrives (any source).
 */
export async function notifyOpsNewLead(params: {
  name: string;
  identifier: string; // phone or email
  source: string;
  need: string;
}): Promise<NotifyResult> {
  const msg = [
    "🎯 *New Lead*",
    "",
    `👤 Name: ${params.name}`,
    `📱 Contact: ${params.identifier}`,
    `📌 Source: ${params.source}`,
    `🎯 Need: ${params.need}`,
    "",
    "📋 View in Ops → /ops/leads",
  ].join("\n");

  return sendOpsWa(msg, `New lead: ${params.name}`);
}

/**
 * Notify ops when a new contact form submission arrives.
 */
export async function notifyOpsContactForm(params: {
  name: string;
  email: string;
  topic: string;
  company?: string;
}): Promise<NotifyResult> {
  const msg = [
    "📨 *New Contact Form Submission*",
    "",
    `👤 Name: ${params.name}`,
    `✉️ Email: ${params.email}`,
    `🏢 Company: ${params.company || "—"}`,
    `📌 Topic: ${params.topic}`,
    "",
    "📋 View in Ops → /ops/leads",
  ].join("\n");

  return sendOpsWa(msg, `Contact form: ${params.name}`);
}

/**
 * Notify ops when a new newsletter subscriber signs up.
 */
export async function notifyOpsNewSubscriber(params: {
  email: string;
  source?: string;
}): Promise<NotifyResult> {
  const msg = [
    "📬 *New Newsletter Subscriber*",
    "",
    `✉️ Email: ${params.email}`,
    `📌 Source: ${params.source || "website"}`,
  ].join("\n");

  return sendOpsWa(msg, `Newsletter: ${params.email}`);
}

/**
 * Notify ops when a ticket is escalated or SLA breached.
 */
export async function notifyOpsTicketEscalation(params: {
  ticketId: string;
  subject: string;
  priority: string;
  reason: string;
}): Promise<NotifyResult> {
  const msg = [
    "🚨 *Ticket Escalation*",
    "",
    `🎫 #${params.ticketId}: ${params.subject}`,
    `⚡ Priority: ${params.priority}`,
    `📝 Reason: ${params.reason}`,
    "",
    "📋 View in Ops → /ops/tickets",
  ].join("\n");

  return sendOpsWa(msg, `Ticket escalation: #${params.ticketId}`);
}

/**
 * Notify ops when a workspace is created.
 */
export async function notifyOpsWorkspaceCreated(params: {
  workspaceName: string;
  ownerEmail: string;
}): Promise<NotifyResult> {
  const msg = [
    "🏢 *New Workspace Created*",
    "",
    `📛 Name: ${params.workspaceName}`,
    `👤 Owner: ${params.ownerEmail}`,
  ].join("\n");

  return sendOpsWa(msg, `New workspace: ${params.workspaceName}`);
}

/**
 * Notify ops when a marketplace purchase is made.
 */
export async function notifyOpsMarketplacePurchase(params: {
  itemName: string;
  buyerEmail: string;
  amountCents: number;
}): Promise<NotifyResult> {
  const msg = [
    "💰 *Marketplace Purchase*",
    "",
    `📦 Item: ${params.itemName}`,
    `👤 Buyer: ${params.buyerEmail}`,
    `💵 Amount: $${(params.amountCents / 100).toFixed(2)}`,
  ].join("\n");

  return sendOpsWa(msg, `Purchase: ${params.itemName}`);
}

/**
 * Send a custom internal WA message from ops.
 * Used by the ops UI for ad-hoc messages to leads.
 */
export async function sendOpsCustomWa(params: {
  to: string;
  message: string;
}): Promise<NotifyResult> {
  if (!params.to || !params.message) {
    return { ok: false, channel: "skipped", error: "Missing to or message" };
  }

  try {
    await sendWhatsAppText({ to: params.to, body: params.message });
    logger.info("[OPS-WA] Custom message sent", { to: params.to });
    return { ok: true, channel: "whatsapp" };
  } catch (e) {
    logger.warn("[OPS-WA] Custom message failed", { to: params.to, error: e });
    return { ok: false, channel: "whatsapp", error: String(e) };
  }
}
