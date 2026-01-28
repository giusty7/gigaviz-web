import { randomUUID, createHash } from "node:crypto";
import os from "node:os";
import { supabaseAdmin } from "../lib/supabase/admin.node";
import { sendWhatsappMessage } from "@/lib/meta/wa-graph";
import { findConnectionById, findTokenForConnection } from "@/lib/meta/wa-connections.node";
import { nextBackoffMs } from "@/lib/worker/backoff";
import { rateLimitDb } from "@/lib/rate-limit.node";

console.log("[WORKER] Starting up...");

// Outbox row mirrors DB shape (see migration)
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
  next_run_at: string | null;
  next_attempt_at: string | null;
  locked_at: string | null;
  locked_by: string | null;
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function getWorkerId() {
  const envId = process.env.WORKER_ID;
  if (envId && envId.trim()) return envId.trim();
  return `${os.hostname()}-${process.pid}-${randomUUID()}`;
}

function computeNextRunIso(ms: number) {
  return new Date(Date.now() + ms).toISOString();
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

async function sendOutboxItem(db: ReturnType<typeof supabaseAdmin>, item: OutboxRow) {
  console.log(`[WORKER] Processing outbox item ${item.id}`);
  const attempts = item.attempts ?? 0;
  const payload = asRecord(item.payload) as SendPayload;
  const messageId = typeof payload.message_id === "string" ? payload.message_id : null;
  const toPhone = item.to_phone;

  console.log(`[WORKER] Item ${item.id}: messageId=${messageId}, toPhone=${toPhone}`);

  if (!messageId || !toPhone) {
    console.error(`[WORKER] Item ${item.id}: Missing messageId or toPhone`);
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await updateOutbox(db, item.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "payload_missing_message_id_or_phone",
      next_run_at: farFuture,
      next_attempt_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return;
  }

  // Rate limit per workspace (shared with webhook/senders)
  const capPerMin = Number(process.env.RATE_CAP_PER_MIN ?? 0) || 0;
  if (capPerMin > 0) {
    const limiter = await rateLimitDb(`wa-send:${item.workspace_id}`, { windowMs: 60_000, max: capPerMin });
    if (!limiter.ok) {
      const nextAttemptAt = computeNextRunIso(60_000);
      await updateOutbox(db, item.id, {
        status: "queued",
        last_error: "rate_limited",
        next_run_at: nextAttemptAt,
        next_attempt_at: nextAttemptAt,
        locked_at: null,
        locked_by: null,
      });
      return;
    }
  }

  const delayMin = Math.max(0, Number(process.env.RATE_DELAY_MIN_MS ?? 800) || 0);
  const delayMax = Math.max(delayMin, Number(process.env.RATE_DELAY_MAX_MS ?? 2200) || delayMin);
  const delay = delayMin + Math.floor(Math.random() * (delayMax - delayMin + 1));
  if (delay > 0) await sleep(delay);

  const connectionId = payload.connection_id ?? item.connection_id;
  if (!connectionId) {
    await markMessageStatus(db, messageId, "failed", null, "connection_missing");
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await updateOutbox(db, item.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "connection_missing",
      next_run_at: farFuture,
      next_attempt_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return;
  }

  const { data: connection, error: connectionErr } = await findConnectionById(db, connectionId);
  console.log(`[WORKER] Item ${item.id}: Connection lookup - connectionId=${connectionId}, found=${!!connection}, err=${connectionErr?.message}`);
  if (connectionErr || !connection) {
    console.error(`[WORKER] Item ${item.id}: Connection lookup failed`);
    await markMessageStatus(db, messageId, "failed", null, "connection_not_found");
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await updateOutbox(db, item.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "connection_not_found",
      next_run_at: farFuture,
      next_attempt_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return;
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
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await updateOutbox(db, item.id, {
      status: "failed",
      attempts: attempts + 1,
      last_error: "token_or_phone_missing",
      next_run_at: farFuture,
      next_attempt_at: farFuture,
      locked_at: null,
      locked_by: null,
    });
    return;
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
        components: [
          {
            type: "body",
            parameters: payload.parameters ?? [],
          },
        ],
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
  console.log(`[WORKER] Item ${item.id}: Sending... enableSend=${enableSend}, toPhone=${toPhone}, type=${item.message_type}`);
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
      // Dry run
      waMessageId = createHash("md5").update(`${messageId}:${Date.now()}`).digest("hex");
    }
  } catch (err) {
    sendError = err instanceof Error ? err.message : "send_exception";
    console.error(`[WORKER] Item ${item.id}: Send exception:`, err);
  }

  console.log(`[WORKER] Item ${item.id}: Send result - waMessageId=${waMessageId}, sendError=${sendError}`);

  if (sendError) {
    const nextAttempt = attempts + 1;
    const maxAttempts = Number(process.env.WORKER_MAX_ATTEMPTS ?? 5) || 5;
    if (nextAttempt >= maxAttempts) {
      await markMessageStatus(db, messageId, "failed", waMessageId, sendError);
      const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await updateOutbox(db, item.id, {
        status: "failed",
        attempts: nextAttempt,
        last_error: sendError,
        next_run_at: farFuture,
        next_attempt_at: farFuture,
        locked_at: null,
        locked_by: null,
      });
      return;
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
    return;
  }

  // Success
  console.log(`[WORKER] Item ${item.id}: SUCCESS - Marking as sent, waMessageId=${waMessageId}`);
  await markMessageStatus(db, messageId, "sent", waMessageId, null);
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
  const { error: outboxUpdateErr } = await updateOutbox(db, item.id, {
    status: "sent",
    attempts: attempts + 1,
    last_error: null,
    next_run_at: farFuture,
    next_attempt_at: farFuture,
    locked_at: null,
    locked_by: null,
  });
  if (outboxUpdateErr) {
    console.error(`[WORKER] Item ${item.id}: Failed to update outbox to 'sent':`, outboxUpdateErr);
  } else {
    console.log(`[WORKER] Item ${item.id}: Outbox updated to 'sent' successfully`);
  }
}

async function runOnce() {
  const db = supabaseAdmin();
  const batchSize = Math.max(1, Number(process.env.WORKER_BATCH_SIZE ?? 20) || 20);
  const workerId = getWorkerId();

  console.log(`[WORKER] Claiming outbox batch (size=${batchSize}, worker=${workerId.slice(0, 20)}...)...`);
  const { data, error } = await db.rpc("claim_outbox", {
    p_batch_size: batchSize,
    p_worker_id: workerId,
  });

  if (error) {
    console.log("OUTBOX_CLAIM_ERROR", error.message);
    return;
  }

  const items = (data ?? []) as OutboxRow[];
  console.log(`[WORKER] Claimed ${items.length} items`);
  for (const item of items) {
    try {
      await sendOutboxItem(db, item);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error("OUTBOX_ITEM_FATAL", { id: item.id, reason, error: err });
      const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await updateOutbox(db, item.id, {
        status: "failed",
        attempts: (item.attempts ?? 0) + 1,
        last_error: reason,
        next_run_at: farFuture,
        next_attempt_at: farFuture,
        locked_at: null,
        locked_by: null,
      });
    }
  }
}

async function run() {
  console.log("[WORKER] Entering run() loop...");
  let keepRunning = true;
  const pollIntervalMs = Math.max(500, Number(process.env.WORKER_POLL_INTERVAL_MS ?? 2000) || 2000);

  const handleStop = () => {
    console.log("[WORKER] Stop signal received");
    keepRunning = false;
  };

  process.on("SIGINT", handleStop);
  process.on("SIGTERM", handleStop);

  console.log(`[WORKER] Poll interval: ${pollIntervalMs}ms`);
  
  while (keepRunning) {
    console.log("[WORKER] Running batch...");
    await runOnce();
    if (!keepRunning) break;
    await sleep(pollIntervalMs);
  }
  
  console.log("[WORKER] Exiting gracefully");
}

console.log("[WORKER] Calling run()...");
run().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("WORKER_FATAL", msg, err);
  process.exit(1);
});
