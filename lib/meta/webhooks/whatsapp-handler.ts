import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";
import { storeMetaEventLog } from "@/lib/meta/events";
import {
  resolveConnectionForWebhook,
  storeOrphanWebhookEvent,
  type WaConnectionRow,
} from "@/lib/meta/wa-connections";

type WaPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: Array<{
          id?: string;
          type?: string;
          timestamp?: string;
          referral?: {
            ctwa_clid?: string;
            source_id?: string;
            source_type?: string;
          };
        }>;
        statuses?: Array<{ id?: string; status?: string; timestamp?: string }>;
      };
    }>;
  }>;
};

function extractPhoneNumberId(payload: WaPayload): string | null {
  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  return change?.value?.metadata?.phone_number_id ?? null;
}

function extractEventInfo(payload: WaPayload) {
  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  const object = payload?.object ?? null;
  const eventType = change?.field ?? null;
  const messageId = change?.value?.messages?.[0]?.id ?? null;
  const statusId = change?.value?.statuses?.[0]?.id ?? null;
  const externalId = messageId || statusId || entry?.id || null;
  return { object, eventType, externalId };
}

function sanitizePayloadAndReferral(payload: WaPayload) {
  let referralHash: string | null = null;
  let referralSourceId: string | null = null;
  let referralSourceType: string | null = null;
  const clone = JSON.parse(JSON.stringify(payload)) as WaPayload;

  const changes = clone.entry?.[0]?.changes?.[0];
  const messages = changes?.value?.messages ?? [];

  messages.forEach((msg) => {
    const referral = msg?.referral;
    if (!referral) return;
    if (referral.ctwa_clid) {
      referralHash = createHash("sha256").update(referral.ctwa_clid.trim()).digest("hex");
    }
    referralSourceId = referral.source_id ?? referralSourceId;
    referralSourceType = referral.source_type ?? referralSourceType;
    delete referral.ctwa_clid;
    if (referralHash) {
      (referral as Record<string, unknown>).ctwa_clid_hash = referralHash;
    }
  });

  return { sanitized: clone, referralHash, referralSourceId, referralSourceType };
}

function getVerifyToken() {
  return (
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.WA_WEBHOOK_VERIFY_TOKEN ||
    process.env.WEBHOOK_VERIFY_TOKEN ||
    ""
  );
}

function verifySignature(raw: string, header: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // if not configured, skip strict verification
  if (!header || !header.startsWith("sha256=")) return false;
  const signature = header.slice("sha256=".length);
  const hmac = createHmac("sha256", secret).update(raw, "utf-8").digest("hex");
  const sigBuf = Buffer.from(signature, "hex");
  const hmacBuf = Buffer.from(hmac, "hex");
  return sigBuf.length === hmacBuf.length && timingSafeEqual(sigBuf, hmacBuf);
}

export function handleMetaWhatsAppVerify(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = getVerifyToken();

  if (mode === "subscribe" && token && expected && token === expected) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function handleMetaWhatsAppWebhook(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`meta-webhook:${ip}`, { windowMs: 60_000, max: 120 });
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited", resetAt: limit.resetAt }, { status: 429 });
  }

  const raw = await req.text().catch(() => "");
  if (!raw) {
    return NextResponse.json(
      { ok: false, code: "invalid_payload", message: "Payload is empty" },
      { status: 400 }
    );
  }

  const signatureHeader = req.headers.get("x-hub-signature-256");
  if (!verifySignature(raw, signatureHeader)) {
    return NextResponse.json(
      { ok: false, code: "invalid_signature", message: "Signature mismatch" },
      { status: 401 }
    );
  }

  let payload: WaPayload | null = null;
  try {
    payload = JSON.parse(raw) as WaPayload;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_payload", message: "Payload is invalid" },
      { status: 400 }
    );
  }

  if (!payload) {
    return NextResponse.json(
      { ok: false, code: "invalid_payload", message: "Payload is invalid" },
      { status: 400 }
    );
  }

  const eventKey = createHash("md5").update(raw).digest("hex");
  const phoneNumberId = extractPhoneNumberId(payload);
  const { object, eventType, externalId } = extractEventInfo(payload);
  const channel = "whatsapp";

  const { sanitized, referralHash, referralSourceId, referralSourceType } =
    sanitizePayloadAndReferral(payload);

  let lastMessageAt: string | null = null;
  const maybeTimestamp = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.timestamp;
  if (maybeTimestamp) {
    const tsNum = Number(maybeTimestamp);
    if (!Number.isNaN(tsNum)) {
      lastMessageAt = new Date(tsNum * 1000).toISOString();
    }
  }

  const db = supabaseAdmin();
  let workspaceId: string | null = null;
  let connectionRow: WaConnectionRow | null = null;

  // Use deterministic connection lookup by phone_number_id
  if (phoneNumberId) {
    const { connection, error: connErr } = await resolveConnectionForWebhook(phoneNumberId);
    if (connErr) {
      logger.error("[meta-webhook] connection lookup failed", { phoneNumberId, message: connErr.message });
    }
    if (connection) {
      workspaceId = connection.workspace_id;
      connectionRow = connection;
    }
  }

  // If no connection found, store as orphan event and return 200 (don't retry)
  if (!workspaceId || !connectionRow) {
    logger.warn("[meta-webhook] orphan event - phone_number_id not registered", {
      phoneNumberId,
      externalId,
    });
    await storeOrphanWebhookEvent({
      phoneNumberId: phoneNumberId ?? "unknown",
      eventKey,
      payload: sanitized,
      error: "phone_number_id not registered to any active connection",
    });
    return NextResponse.json(
      { ok: true, stored: false, code: "orphan_event", phoneNumberId },
      { status: 200 }
    );
  }

  const insertPayload = {
    workspace_id: workspaceId,
    channel,
    object,
    event_type: eventType,
    external_event_id: externalId,
    event_key: eventKey,
    payload_json: sanitized,
    received_at: new Date().toISOString(),
  };

  const { data: existing } = await db
    .from("meta_webhook_events")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("event_key", eventKey)
    .maybeSingle();

  const { error } = await db
    .from("meta_webhook_events")
    .upsert(insertPayload, { onConflict: "workspace_id,event_key" });

  if (error) {
    const missingUnique =
      error.message?.includes("no unique") ||
      error.message?.includes("unique or exclusion constraint");
    if (process.env.NODE_ENV === "development") {
      console.error("[meta-webhook] upsert error", error);
    }
    return NextResponse.json(
      {
        ok: false,
        code: missingUnique ? "missing_unique_index" : "db_error",
        message: "Failed to store webhook",
        details: error.details ?? error.message,
        hint: (error as { hint?: string }).hint ?? null,
      },
      { status: 500 }
    );
  }

  try {
    await storeMetaEventLog({
      workspaceId,
      eventType: eventType ?? "wa_webhook",
      source: "webhook",
      payload: sanitized,
      referralHash,
    });
  } catch (err) {
    logger.warn("[meta-webhook] meta_events_log insert failed", {
      workspaceId,
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  try {
    const { processWhatsappEvents } = await import("@/lib/meta/wa-inbox");
    await processWhatsappEvents(workspaceId, 5);
  } catch (err) {
    logger.dev("[meta-webhook] inline processing skipped", {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  if (referralHash) {
    const waId = externalId ?? eventKey;
    const { error: convoError } = await db.from("meta_conversations").upsert(
      {
        workspace_id: workspaceId,
        wa_id: waId,
        last_message_at: lastMessageAt,
        ctwa_clid_hash: referralHash,
        referral_source_id: referralSourceId,
        referral_source_type: referralSourceType,
      },
      { onConflict: "workspace_id,wa_id" }
    );
    if (convoError) {
      logger.warn("[meta-webhook] meta_conversations upsert failed", {
        message: convoError.message,
        workspaceId,
      });
    }
  }

  if (phoneNumberId) {
    try {
      const { data: connection } = await db
        .from("meta_whatsapp_connections")
        .select("waba_id, phone_number_id, display_phone_number, verified_name")
        .eq("workspace_id", workspaceId)
        .eq("phone_number_id", phoneNumberId)
        .maybeSingle();

      await db
        .from("meta_assets_cache")
        .upsert(
          {
            workspace_id: workspaceId,
            phone_number_id: phoneNumberId,
            waba_id: connection?.waba_id ?? connectionRow?.waba_id ?? null,
            display_phone_number: connection?.display_phone_number ?? connectionRow?.display_name ?? null,
            verified_name: connection?.verified_name ?? connectionRow?.display_name ?? null,
            quality_rating: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id,phone_number_id" }
        );
    } catch (cacheErr) {
      logger.warn("[meta-webhook] meta_assets_cache upsert failed", {
        workspaceId,
        message: cacheErr instanceof Error ? cacheErr.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    workspaceId,
    stored: !existing,
    deduped: Boolean(existing),
  });
}
