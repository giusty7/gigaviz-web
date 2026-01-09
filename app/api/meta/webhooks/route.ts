import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === expected) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`meta-webhook:${ip}`, { windowMs: 60_000, max: 120 });
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited", resetAt: limit.resetAt }, { status: 429 });
  }

  const payload = (await req.json().catch(() => null)) as WaPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

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
    return NextResponse.json({ status: "accepted_unassigned" }, { status: 202 });
  }

  const insertPayload = {
    workspace_id: workspaceId,
    channel,
    object,
    event_type: eventType,
    external_event_id: externalId,
    payload_json: payload,
    received_at: new Date().toISOString(),
  };

  const { error } = await db
    .from("meta_webhook_events")
    .upsert(insertPayload, { onConflict: "workspace_id,external_event_id" });

  if (error && error.code !== "23505") {
    logger.error("[meta-webhook] insert failed", { message: error.message, code: error.code });
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
