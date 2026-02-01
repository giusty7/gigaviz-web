import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { findConnectionById, findTokenForConnection } from "@/lib/meta/wa-connections";
import { sendWhatsappMessage } from "@/lib/meta/wa-graph";
import { updateWorkerHeartbeat } from "@/lib/ops/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = Number(process.env.WORKER_BATCH_SIZE ?? 20) || 20;
const CRON_SECRET = process.env.CRON_SECRET || "";

type OutboxRow = {
  id: string;
  workspace_id: string;
  thread_id: string | null;
  connection_id: string | null;
  to_phone: string;
  message_type: string;
  payload: unknown;
  attempts: number | null;
  status: string;
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

function computeNextRunIso(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function nextBackoffMs(attempt: number): number {
  const base = 60_000;
  const max = 3600_000;
  return Math.min(base * Math.pow(2, attempt - 1), max);
}

async function updateOutbox(db: ReturnType<typeof supabaseAdmin>, id: string, values: Record<string, unknown>) {
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

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!CRON_SECRET) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn("[outbox-worker] CRON_SECRET not set, allowing in dev mode");
    } else {
      logger.error("[outbox-worker] CRON_SECRET not configured in production");
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
  } else if (authHeader !== `Bearer ${CRON_SECRET}`) {
    logger.warn("[outbox-worker] unauthorized cron attempt");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const workerId = `github-actions-${Date.now()}`;

  logger.info("[outbox-worker] starting batch", { batchSize: BATCH_SIZE });

  const { data, error } = await db.rpc("claim_outbox", {
    p_batch_size: BATCH_SIZE,
    p_worker_id: workerId,
  });

  if (error) {
    logger.error("[outbox-worker] claim_outbox failed", { error: error.message });
    return NextResponse.json({ error: "claim_failed", message: error.message }, { status: 500 });
  }

  const items = (data ?? []) as OutboxRow[];
  logger.info("[outbox-worker] claimed items", { count: items.length });

  let sentCount = 0;
  let failedCount = 0;
  let requeuedCount = 0;
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  for (const item of items) {
    try {
      const attempts = item.attempts ?? 0;
      const payload = asRecord(item.payload) as SendPayload;
      const messageId = typeof payload.message_id === "string" ? payload.message_id : null;
      const toPhone = item.to_phone;

      if (!messageId || !toPhone) {
        await updateOutbox(db, item.id, {
          status: "failed",
          attempts: attempts + 1,
          last_error: "payload_missing_message_id_or_phone",
          next_run_at: farFuture,
          next_attempt_at: farFuture,
          locked_at: null,
          locked_by: null,
        });
        failedCount++;
        continue;
      }

      const connectionId = payload.connection_id ?? item.connection_id;
      if (!connectionId) {
        await markMessageStatus(db, messageId, "failed", null, "connection_missing");
        await updateOutbox(db, item.id, {
          status: "failed",
          attempts: attempts + 1,
          last_error: "connection_missing",
          next_run_at: farFuture,
          next_attempt_at: farFuture,
          locked_at: null,
          locked_by: null,
        });
        failedCount++;
        continue;
      }

      const { data: connection, error: connectionErr } = await findConnectionById(db, connectionId);
      if (connectionErr || !connection) {
        await markMessageStatus(db, messageId, "failed", null, "connection_not_found");
        await updateOutbox(db, item.id, {
          status: "failed",
          attempts: attempts + 1,
          last_error: "connection_not_found",
          next_run_at: farFuture,
          next_attempt_at: farFuture,
          locked_at: null,
          locked_by: null,
        });
        failedCount++;
        continue;
      }

      const { data: tokenRow } = await findTokenForConnection(
        db,
        connection.workspace_id,
        connection.phone_number_id,
        connection.waba_id
      );
      const accessToken = tokenRow?.token_encrypted ?? null;
      const phoneNumberId = payload.phone_number_id ?? connection.phone_number_id;

      if (!accessToken || !phoneNumberId) {
        await markMessageStatus(db, messageId, "failed", null, "token_or_phone_missing");
        await updateOutbox(db, item.id, {
          status: "failed",
          attempts: attempts + 1,
          last_error: "token_or_phone_missing",
          next_run_at: farFuture,
          next_attempt_at: farFuture,
          locked_at: null,
          locked_by: null,
        });
        failedCount++;
        continue;
      }

      const messaging_product = "whatsapp";
      let sendPayload: Record<string, unknown>;
      if (item.message_type === "template") {
        sendPayload = {
          messaging_product,
          to: toPhone,
          type: "template",
          template: {
            name: payload.template_name,
            language: { code: payload.language },
            components: [{ type: "body", parameters: payload.parameters ?? [] }],
          },
        };
      } else {
        sendPayload = {
          messaging_product,
          to: toPhone,
          type: "text",
          text: { body: payload.text ?? "" },
        };
      }

      const enableSend = process.env.ENABLE_WA_SEND === "true";
      let waMessageId: string | null = null;
      let sendError: string | null = null;

      try {
        if (enableSend) {
          const sendResult = await sendWhatsappMessage({
            phoneNumberId,
            token: accessToken,
            payload: sendPayload,
          });
          waMessageId = sendResult.messageId ?? null;
          if (!sendResult.ok) {
            sendError = sendResult.errorMessage ?? "send_failed";
          }
        } else {
          waMessageId = createHash("md5").update(`${messageId}:${Date.now()}`).digest("hex");
        }
      } catch (err) {
        sendError = err instanceof Error ? err.message : "send_exception";
      }

      if (sendError) {
        const nextAttempt = attempts + 1;
        const maxAttempts = Number(process.env.WORKER_MAX_ATTEMPTS ?? 5) || 5;
        if (nextAttempt >= maxAttempts) {
          await markMessageStatus(db, messageId, "failed", waMessageId, sendError);
          await updateOutbox(db, item.id, {
            status: "failed",
            attempts: nextAttempt,
            last_error: sendError,
            next_run_at: farFuture,
            next_attempt_at: farFuture,
            locked_at: null,
            locked_by: null,
          });
          failedCount++;
          continue;
        }

        const backoffMs = nextBackoffMs(nextAttempt);
        const nextAttemptAt = computeNextRunIso(backoffMs);

        await markMessageStatus(db, messageId, "queued", waMessageId, sendError);
        await updateOutbox(db, item.id, {
          status: "queued",
          attempts: nextAttempt,
          last_error: sendError,
          next_run_at: nextAttemptAt,
          next_attempt_at: nextAttemptAt,
          locked_at: null,
          locked_by: null,
        });
        requeuedCount++;
        continue;
      }

      await markMessageStatus(db, messageId, "sent", waMessageId, null);
      await updateOutbox(db, item.id, {
        status: "sent",
        attempts: attempts + 1,
        last_error: null,
        next_run_at: farFuture,
        next_attempt_at: farFuture,
        locked_at: null,
        locked_by: null,
      });
      sentCount++;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.error("[outbox-worker] item processing failed", { itemId: item.id, error: reason });
      await updateOutbox(db, item.id, {
        status: "failed",
        attempts: (item.attempts ?? 0) + 1,
        last_error: reason,
        next_run_at: farFuture,
        next_attempt_at: farFuture,
        locked_at: null,
        locked_by: null,
      });
      failedCount++;
    }
  }

  logger.info("[outbox-worker] batch completed", { sent: sentCount, failed: failedCount, requeued: requeuedCount });

  // Record worker heartbeat
  try {
    await updateWorkerHeartbeat({
      workerName: "outbox-worker",
      workerType: "cron",
      status: "completed",
      lastRunAt: new Date().toISOString(),
      nextRunAt: computeNextRunIso(120_000), // Next run in 2 minutes
      errorCount: failedCount,
      lastError: failedCount > 0 ? `${failedCount} items failed` : undefined,
      metadata: { sent: sentCount, failed: failedCount, requeued: requeuedCount },
    });
  } catch (err) {
    logger.error("[outbox-worker] Failed to record heartbeat", { error: err });
  }

  return NextResponse.json({
    ok: true,
    processed: items.length,
    sent: sentCount,
    failed: failedCount,
    requeued: requeuedCount,
  });
}