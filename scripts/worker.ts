import { randomUUID } from "node:crypto";
import os from "node:os";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/wa/cloud";
import { nextBackoffMs } from "@/lib/worker/backoff";

type OutboxRow = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  to_phone: string;
  payload: unknown;
  attempts: number | null;
  status: string;
  next_run_at: string | null;
  next_attempt_at: string | null;
  locked_at: string | null;
  locked_by: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function parsePayload(payload: unknown) {
  const data = asRecord(payload);
  const messageId = typeof data.message_id === "string" ? data.message_id : null;
  const text = typeof data.text === "string" ? data.text : "";
  return { messageId, text };
}

function computeNextRunIso(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function computeNextMinuteIso() {
  const now = new Date();
  const rounded = new Date(now);
  rounded.setSeconds(0, 0);
  return new Date(rounded.getTime() + 60_000).toISOString();
}

function getWorkerId() {
  const envId = process.env.WORKER_ID;
  if (envId && envId.trim()) return envId.trim();
  return `${os.hostname()}-${process.pid}-${randomUUID()}`;
}

async function takeRateSlot(
  db: ReturnType<typeof supabaseAdmin>,
  workspaceId: string,
  cap: number
) {
  if (!cap || cap <= 0) return true;
  const { data, error } = await db.rpc("take_rate_limit_slot", {
    p_workspace_id: workspaceId,
    p_cap: cap,
  });
  if (error) {
    throw new Error(error.message || "rate_limit_rpc_failed");
  }
  return Boolean(data);
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

async function runOnce() {
  const db = supabaseAdmin();
  const batchSize = Math.max(1, Number(process.env.WORKER_BATCH_SIZE ?? 20) || 20);
  const rateCap = Number(process.env.RATE_CAP_PER_MIN ?? 0) || 0;
  const delayMin = Math.max(0, Number(process.env.RATE_DELAY_MIN_MS ?? 800) || 0);
  const delayMax = Math.max(delayMin, Number(process.env.RATE_DELAY_MAX_MS ?? 2200) || delayMin);
  const enableSend = process.env.ENABLE_WA_SEND === "true";
  const workerId = getWorkerId();

  const { data, error } = await db.rpc("claim_outbox", {
    p_batch_size: batchSize,
    p_worker_id: workerId,
  });

  if (error) {
    console.log("OUTBOX_CLAIM_ERROR", error.message);
    return;
  }

  const items = (data ?? []) as OutboxRow[];
  for (const item of items) {
    const attempts = item.attempts ?? 0;
    const { messageId, text } = parsePayload(item.payload);
    if (!messageId || !item.to_phone) {
      await updateOutbox(db, item.id, {
        status: "failed",
        attempts: attempts + 1,
        last_error: "payload_missing_message_id_or_phone",
        next_run_at: null,
        next_attempt_at: null,
        locked_at: null,
        locked_by: null,
      });
      continue;
    }

    try {
      const rateAllowed = await takeRateSlot(db, item.workspace_id, rateCap);
      if (!rateAllowed) {
        const nextAttemptAt = computeNextMinuteIso();
        await updateOutbox(db, item.id, {
          status: "queued",
          last_error: "rate_limited",
          next_run_at: nextAttemptAt,
          next_attempt_at: nextAttemptAt,
          locked_at: null,
          locked_by: null,
        });
        continue;
      }

      const delay = delayMin + Math.floor(Math.random() * (delayMax - delayMin + 1));
      if (delay > 0) await sleep(delay);

      if (!enableSend) {
        await db
          .from("messages")
          .update({ status: "sent", error_reason: null })
          .eq("id", messageId);

        const { error: eventErr } = await db.from("message_events").insert({
          message_id: messageId,
          event_type: "send.dry_run",
          payload: { text, outbox_id: item.id },
        });
        if (eventErr) {
          console.log("message_events insert failed (dry_run)", eventErr.message);
        }

        await updateOutbox(db, item.id, {
          status: "sent",
          last_error: null,
          next_run_at: null,
          next_attempt_at: null,
          locked_at: null,
          locked_by: null,
        });
        continue;
      }

      const sendRes = await sendWhatsAppText({
        to: item.to_phone,
        body: text,
      });

      const data = asRecord(sendRes.data);
      const messages = Array.isArray(data.messages) ? data.messages : [];
      const waMessageId =
        typeof (messages[0] as Record<string, unknown> | undefined)?.id === "string"
          ? ((messages[0] as Record<string, unknown>).id as string)
          : null;
      await db
        .from("messages")
        .update({ status: "sent", wa_message_id: waMessageId, error_reason: null })
        .eq("id", messageId);

      const { error: sendErr } = await db.from("message_events").insert({
        message_id: messageId,
        event_type: "send.success",
        payload: asRecord(sendRes.data),
      });
      if (sendErr) {
        console.log("message_events insert failed (send_success)", sendErr.message);
      }

      await updateOutbox(db, item.id, {
        status: "sent",
        last_error: null,
        next_run_at: null,
        next_attempt_at: null,
        locked_at: null,
        locked_by: null,
      });
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : "send_failed";
      const nextAttempt = attempts + 1;
      const backoffMs = nextBackoffMs(nextAttempt);
      const nextAttemptAt = computeNextRunIso(backoffMs);
      const maxAttempts = Number(process.env.WORKER_MAX_ATTEMPTS ?? 5) || 5;

      if (nextAttempt >= maxAttempts) {
        await db
          .from("messages")
          .update({ status: "failed", error_reason: reason })
          .eq("id", messageId);

        const { error: failErr } = await db.from("message_events").insert({
          message_id: messageId,
          event_type: "send.failed",
          payload: { error: reason, attempts: nextAttempt },
        });
        if (failErr) {
          console.log("message_events insert failed (send_failed)", failErr.message);
        }

        await updateOutbox(db, item.id, {
          status: "failed",
          attempts: nextAttempt,
          last_error: reason,
          next_run_at: null,
          next_attempt_at: null,
          locked_at: null,
          locked_by: null,
        });
        continue;
      }

      const { error: retryErr } = await db.from("message_events").insert({
        message_id: messageId,
        event_type: "send.retry",
        payload: { error: reason, attempts: nextAttempt },
      });
      if (retryErr) {
        console.log("message_events insert failed (send_retry)", retryErr.message);
      }

      await updateOutbox(db, item.id, {
        status: "queued",
        attempts: nextAttempt,
        last_error: reason,
        next_run_at: nextAttemptAt,
        next_attempt_at: nextAttemptAt,
        locked_at: null,
        locked_by: null,
      });
    }
  }
}

async function run() {
  let keepRunning = true;
  const pollIntervalMs = Math.max(500, Number(process.env.WORKER_POLL_INTERVAL_MS ?? 2000) || 2000);

  const handleStop = () => {
    keepRunning = false;
  };

  process.on("SIGINT", handleStop);
  process.on("SIGTERM", handleStop);

  while (keepRunning) {
    await runOnce();
    if (!keepRunning) break;
    await sleep(pollIntervalMs);
  }
}

run().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("WORKER_FATAL", msg);
  process.exit(1);
});
