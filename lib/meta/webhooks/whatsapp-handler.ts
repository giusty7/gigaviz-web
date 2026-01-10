import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";

type WaPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: Array<{ id?: string; type?: string; timestamp?: string }>;
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

function getVerifyToken() {
  return (
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.WA_WEBHOOK_VERIFY_TOKEN ||
    process.env.WEBHOOK_VERIFY_TOKEN ||
    ""
  );
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
      { ok: false, code: "invalid_payload", message: "Payload kosong" },
      { status: 400 }
    );
  }

  let payload: WaPayload | null = null;
  try {
    payload = JSON.parse(raw) as WaPayload;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_payload", message: "Payload tidak valid" },
      { status: 400 }
    );
  }

  if (!payload) {
    return NextResponse.json(
      { ok: false, code: "invalid_payload", message: "Payload tidak valid" },
      { status: 400 }
    );
  }

  const eventKey = createHash("md5").update(raw).digest("hex");
  const phoneNumberId = extractPhoneNumberId(payload);
  const { object, eventType, externalId } = extractEventInfo(payload);
  const channel = "whatsapp";

  const db = supabaseAdmin();
  let workspaceId: string | null = null;

  if (phoneNumberId) {
    const { data, error } = await db
      .from("wa_phone_numbers")
      .select("workspace_id")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();
    if (error) {
      logger.error("[meta-webhook] lookup phone failed", { message: error.message });
    }
    workspaceId = data?.workspace_id ?? null;
  }

  if (!workspaceId) {
    logger.warn("[meta-webhook] workspace not mapped", { phoneNumberId, externalId });
    return NextResponse.json(
      { ok: true, stored: false, code: "workspace_not_found" },
      { status: 202 }
    );
  }

  const insertPayload = {
    workspace_id: workspaceId,
    channel,
    object,
    event_type: eventType,
    external_event_id: externalId,
    event_key: eventKey,
    payload_json: payload,
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
        message: "Gagal menyimpan webhook",
        details: error.details ?? error.message,
        hint: (error as { hint?: string }).hint ?? null,
      },
      { status: 500 }
    );
  }

  try {
    const { processWhatsappEvents } = await import("@/lib/meta/wa-inbox");
    await processWhatsappEvents(workspaceId, 5);
  } catch (err) {
    logger.dev("[meta-webhook] inline processing skipped", {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({
    ok: true,
    workspaceId,
    stored: true,
    deduped: Boolean(existing),
  });
}
