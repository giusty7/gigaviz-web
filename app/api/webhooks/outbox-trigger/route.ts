/**
 * Database Webhook Endpoint: Outbox Trigger
 * 
 * This endpoint is called by Supabase Database Webhooks when:
 * 1. New message inserted into outbox_messages (INSERT trigger)
 * 2. Failed message is requeued (UPDATE trigger)
 * 
 * It immediately processes the outbox message, providing real-time
 * message delivery instead of polling with cron jobs.
 * 
 * Setup in Supabase Dashboard:
 * 1. Database > Webhooks > Create webhook
 * 2. Event: INSERT on outbox_messages
 * 3. URL: https://gigaviz.com/api/webhooks/outbox-trigger
 * 4. Headers: Authorization: Bearer ${WEBHOOK_SECRET}
 * 5. Event: UPDATE on outbox_messages (optional, for retries)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { findConnectionById, findTokenForConnection } from "@/lib/meta/wa-connections";
import { sendWhatsappMessage } from "@/lib/meta/wa-graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.CRON_SECRET || "";

type OutboxWebhookPayload = {
  type: "INSERT" | "UPDATE";
  table: string;
  schema: string;
  record: {
    id: string;
    workspace_id: string;
    thread_id?: string | null;
    connection_id?: string | null;
    to_phone: string;
    message_type: string;
    payload: unknown;
    status: string;
    attempts: number;
    next_attempt_at?: string;
  };
  old_record?: Record<string, unknown>;
};

type SendPayload = {
  message_id?: string | null;
  text?: string;
  template_name?: string;
  language?: string;
  parameters?: Array<{ type: string; text: string }>;
  connection_id?: string | null;
  phone_number_id?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

async function updateOutbox(
  db: ReturnType<typeof supabaseAdmin>,
  id: string,
  values: Record<string, unknown>
) {
  return db
    .from("outbox_messages")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id);
}

async function markMessageStatus(
  db: ReturnType<typeof supabaseAdmin>,
  messageId: string,
  status: string,
  waMessageId: string | null,
  errorMessage?: string | null
) {
  const statusTime = new Date().toISOString();
  await db
    .from("wa_messages")
    .update({
      status,
      status_updated_at: statusTime,
      status_at: statusTime,
      wa_message_id: waMessageId,
      error_message: errorMessage ?? null,
      failed_at: status === "failed" ? statusTime : null,
      sent_at: status === "sent" ? statusTime : null,
    })
    .eq("id", messageId);
}

function nextBackoffMs(attempt: number): number {
  const base = 60_000; // 1 minute
  const max = 3600_000; // 1 hour
  return Math.min(base * Math.pow(2, attempt - 1), max);
}

export async function POST(req: NextRequest) {
  // Verify webhook signature
  const authHeader = req.headers.get("authorization");
  
  if (!WEBHOOK_SECRET) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn("[outbox-trigger] WEBHOOK_SECRET not set, allowing in dev mode");
    } else {
      logger.error("[outbox-trigger] WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
  } else if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    logger.warn("[outbox-trigger] Unauthorized webhook attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: OutboxWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate payload
  if (!payload.record?.id) {
    logger.warn("[outbox-trigger] Missing record ID");
    return NextResponse.json({ error: "Missing record ID" }, { status: 400 });
  }

  const record = payload.record;
  logger.info("[outbox-trigger] Processing outbox message", {
    id: record.id,
    type: payload.type,
    status: record.status,
    attempts: record.attempts,
  });

  // Only process queued messages
  if (record.status !== "queued") {
    logger.info("[outbox-trigger] Skipping non-queued message", { status: record.status });
    return NextResponse.json({ ok: true, skipped: true, reason: "not_queued" });
  }

  const db = supabaseAdmin();
  const workerId = `webhook-${Date.now()}`;
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Claim the message (atomic update to prevent duplicate processing)
  const { data: claimed, error: claimError } = await db
    .from("outbox_messages")
    .update({
      status: "processing",
      locked_at: new Date().toISOString(),
      locked_by: workerId,
    })
    .eq("id", record.id)
    .eq("status", "queued") // Only claim if still queued
    .select()
    .single();

  if (claimError || !claimed) {
    logger.info("[outbox-trigger] Failed to claim message - already processing", {
      id: record.id,
      error: claimError?.message,
    });
    return NextResponse.json({ ok: true, skipped: true, reason: "already_claimed" });
  }

  // Process the message
  const attempts = record.attempts ?? 0;
  const sendPayload = asRecord(record.payload) as SendPayload;
  const messageId = typeof sendPayload.message_id === "string" ? sendPayload.message_id : null;
  const toPhone = record.to_phone;

  if (!messageId || !toPhone) {
    logger.error("[outbox-trigger] Missing message_id or to_phone", { id: record.id });
    await updateOutbox(db, record.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "payload_missing_message_id_or_phone",
      next_run_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const connectionId = sendPayload.connection_id ?? record.connection_id;
  if (!connectionId) {
    logger.error("[outbox-trigger] Missing connection_id", { id: record.id });
    await markMessageStatus(db, messageId, "failed", null, "connection_missing");
    await updateOutbox(db, record.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "connection_missing",
      next_run_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return NextResponse.json({ ok: false, error: "connection_missing" }, { status: 400 });
  }

  // Get connection and token
  const { data: connection, error: connError } = await findConnectionById(db, connectionId);
  if (connError || !connection) {
    logger.error("[outbox-trigger] Connection not found", { connectionId, error: connError?.message });
    await markMessageStatus(db, messageId, "failed", null, "connection_not_found");
    await updateOutbox(db, record.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "connection_not_found",
      next_run_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return NextResponse.json({ ok: false, error: "connection_not_found" }, { status: 404 });
  }

  const { data: tokenRow, error: tokenError } = await findTokenForConnection(
    db,
    connection.workspace_id,
    connection.phone_number_id,
    connection.waba_id
  );
  const accessToken = tokenRow?.token_encrypted ?? null;
  if (tokenError || !accessToken) {
    logger.error("[outbox-trigger] Access token not found", { connectionId, error: tokenError?.message });
    await markMessageStatus(db, messageId, "failed", null, "token_not_found");
    await updateOutbox(db, record.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "token_not_found",
      next_run_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return NextResponse.json({ ok: false, error: "token_not_found" }, { status: 404 });
  }

  // Build WhatsApp payload
  const phoneNumberId = sendPayload.phone_number_id ?? connection.phone_number_id;
  if (!phoneNumberId) {
    logger.error("[outbox-trigger] Missing phone_number_id", { connectionId });
    await markMessageStatus(db, messageId, "failed", null, "phone_number_id_missing");
    await updateOutbox(db, record.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "phone_number_id_missing",
      next_run_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return NextResponse.json({ ok: false, error: "phone_number_id_missing" }, { status: 400 });
  }
  
  let graphPayload: Record<string, unknown>;

  if (record.message_type === "template") {
    graphPayload = {
      messaging_product: "whatsapp",
      to: toPhone,
      type: "template",
      template: {
        name: sendPayload.template_name,
        language: { code: sendPayload.language ?? "en" },
        components: sendPayload.parameters
          ? [{ type: "body", parameters: sendPayload.parameters }]
          : [],
      },
    };
  } else {
    graphPayload = {
      messaging_product: "whatsapp",
      to: toPhone,
      type: "text",
      text: { body: sendPayload.text ?? "" },
    };
  }

  // Send to WhatsApp
  const enableSend = process.env.ENABLE_WA_SEND !== "false";
  let waMessageId: string | null = null;
  let sendError: string | null = null;

  try {
    if (enableSend) {
      const sendResult = await sendWhatsappMessage({
        phoneNumberId,
        token: accessToken,
        payload: graphPayload,
      });
      waMessageId = sendResult.messageId ?? null;
      if (!sendResult.ok) {
        sendError = sendResult.errorMessage ?? "send_failed";
      }
    } else {
      // Dry run mode
      waMessageId = `dry_run_${Date.now()}`;
      logger.info("[outbox-trigger] DRY RUN mode - not actually sending");
    }
  } catch (err) {
    sendError = err instanceof Error ? err.message : "send_exception";
    logger.error("[outbox-trigger] Send exception", { error: sendError, id: record.id });
  }

  // Handle result
  if (sendError) {
    const nextAttempt = attempts + 1;
    const maxAttempts = Number(process.env.WORKER_MAX_ATTEMPTS ?? 5) || 5;
    
    if (nextAttempt >= maxAttempts) {
      // Max retries reached - mark as failed
      logger.error("[outbox-trigger] Max retries reached", {
        id: record.id,
        attempts: nextAttempt,
        error: sendError,
      });
      await markMessageStatus(db, messageId, "failed", null, sendError);
      await updateOutbox(db, record.id, {
        status: "failed",
        attempts: nextAttempt,
        last_error: sendError,
        next_run_at: farFuture,
        locked_at: null,
        locked_by: null,
      });
      return NextResponse.json({ ok: false, error: "max_retries", attempts: nextAttempt });
    } else {
      // Requeue with exponential backoff
      const backoffMs = nextBackoffMs(nextAttempt);
      const nextRunAt = new Date(Date.now() + backoffMs).toISOString();
      
      logger.warn("[outbox-trigger] Requeuing with backoff", {
        id: record.id,
        attempts: nextAttempt,
        backoffMs,
        nextRunAt,
        error: sendError,
      });
      
      await updateOutbox(db, record.id, {
        status: "queued", // Back to queued - will trigger another webhook
        attempts: nextAttempt,
        last_error: sendError,
        next_attempt_at: nextRunAt,
        next_run_at: nextRunAt,
        locked_at: null,
        locked_by: null,
      });
      
      return NextResponse.json({ ok: true, requeued: true, attempts: nextAttempt, nextRunAt });
    }
  }

  // Success!
  logger.info("[outbox-trigger] Message sent successfully", {
    id: record.id,
    waMessageId,
    messageId,
  });
  
  await markMessageStatus(db, messageId, "sent", waMessageId);
  await updateOutbox(db, record.id, {
    status: "sent",
    attempts: attempts + 1,
    locked_at: null,
    locked_by: null,
  });

  return NextResponse.json({
    ok: true,
    sent: true,
    waMessageId,
    attempts: attempts + 1,
  });
}
