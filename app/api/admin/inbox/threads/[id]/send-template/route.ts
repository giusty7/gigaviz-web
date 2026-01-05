import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { normalizePhone } from "@/lib/contacts/normalize";
import { computeFirstResponseAt } from "@/lib/inbox/first-response";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

type MessageRow = {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  text: string;
  ts: string;
  status: string | null;
  wa_message_id: string | null;
  error_reason: string | null;
  media_url: string | null;
  media_mime: string | null;
  media_sha256: string | null;
};

type TemplateComponent = Record<string, unknown>;

function mapMessage(row: MessageRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    text: row.text,
    ts: row.ts,
    status: row.status ?? undefined,
    waMessageId: row.wa_message_id ?? undefined,
    errorReason: row.error_reason ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    mediaMime: row.media_mime ?? undefined,
    mediaSha256: row.media_sha256 ?? undefined,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function hashIdempotencySeed(seed: string) {
  return createHash("sha256").update(seed).digest("hex");
}

function isTruthy(value: string | undefined) {
  const v = (value || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function sanitizeToken(value: string) {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  if (/\s/.test(unquoted)) {
    throw new Error("Invalid WA access token (contains whitespace)");
  }
  return unquoted;
}

function requiredEnvAny(names: string[], opts?: { sanitizeToken?: boolean }) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return opts?.sanitizeToken ? sanitizeToken(value) : value;
    }
  }
  throw new Error(`Missing env: ${names.join(" or ")}`);
}

function normalizeGraphVersion(raw?: string) {
  const cleaned = (raw || "").trim();
  if (!cleaned) return "v22.0";
  return cleaned.startsWith("v") ? cleaned : `v${cleaned}`;
}

type WhatsAppErrorResponse = {
  error?: {
    message?: string;
  };
};

function getApiErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const error = (data as WhatsAppErrorResponse).error;
    if (error?.message) return error.message;
  }
  return fallback;
}

function extractWaMessageId(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const messages = (payload as { messages?: Array<{ id?: unknown }> }).messages;
  const id = messages?.[0]?.id;
  return typeof id === "string" ? id : null;
}

function toErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "wa_send_failed";
}

async function sendWhatsAppTemplate(params: {
  to: string;
  templateName: string;
  language: string;
  components: TemplateComponent[];
}) {
  const token = requiredEnvAny(["WA_ACCESS_TOKEN", "WA_CLOUD_API_TOKEN"], {
    sanitizeToken: true,
  });
  const phoneNumberId = requiredEnvAny(["WA_PHONE_NUMBER_ID"]);
  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.to,
        type: "template",
        template: {
          name: params.templateName,
          language: { code: params.language },
          components: params.components ?? [],
        },
      }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok) {
      const msg = getApiErrorMessage(data, `WA API failed (${res.status})`);
      throw new Error(msg);
    }

    return { ok: true as const, data };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as {
    templateName?: unknown;
    language?: unknown;
    components?: unknown;
    idempotencyKey?: unknown;
    idempotency_key?: unknown;
  };

  const templateName = String(body?.templateName ?? "").trim();
  const language = String(body?.language ?? "").trim() || "id";
  const components = Array.isArray(body?.components)
    ? (body.components as TemplateComponent[])
    : [];

  if (!templateName) {
    return withCookies(
      NextResponse.json({ error: "template_name_required" }, { status: 400 })
    );
  }

  const templateText = `Template: ${templateName}`;
  const rawKey =
    String(body?.idempotencyKey ?? body?.idempotency_key ?? "").trim() ||
    String(req.headers.get("Idempotency-Key") || "").trim();
  const bucket = Math.floor(Date.now() / 30_000);
  const componentsHash = hashIdempotencySeed(JSON.stringify(components));
  const autoKeySeed = `${workspaceId}|${id}|${templateName}|${language}|${componentsHash}|${bucket}`;
  const idempotencyKey = rawKey ? `req:${rawKey}` : `auto:${hashIdempotencySeed(autoKeySeed)}`;

  const { data: conv, error: convErr } = await db
    .from("conversations")
    .select("id, contact_id, last_customer_message_at, first_response_at")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .single();

  if (convErr || !conv) {
    return withCookies(
      NextResponse.json({ error: convErr?.message ?? "conversation_not_found" }, { status: 404 })
    );
  }

  const { data: contact, error: cErr } = await db
    .from("contacts")
    .select("id, phone, comms_status")
    .eq("workspace_id", workspaceId)
    .eq("id", conv.contact_id)
    .single();

  if (cErr || !contact) {
    return withCookies(
      NextResponse.json({ error: cErr?.message ?? "contact_not_found" }, { status: 404 })
    );
  }

  if (!contact?.phone) {
    return withCookies(NextResponse.json({ error: "contact_phone_missing" }, { status: 400 }));
  }

  const toPhone = normalizePhone(contact.phone);

  if (contact.comms_status === "blacklisted") {
    const { error: eventErr } = await db.from("conversation_events").insert({
      conversation_id: id,
      type: "send_blocked",
      meta: { reason: "blacklisted", contact_id: contact.id, templateName, language },
      created_by: user?.id ?? "system",
    });
    if (eventErr) {
      console.log("conversation_events insert failed (send_blocked)", eventErr.message);
    }
    return withCookies(
      NextResponse.json({ error: "contact_blacklisted" }, { status: 403 })
    );
  }

  const { data: existingOutbox } = await db
    .from("outbox_messages")
    .select("id, payload, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingOutbox) {
    const payload = asRecord(existingOutbox.payload);
    const messageId = typeof payload.message_id === "string" ? payload.message_id : null;
    if (messageId) {
      const { data: existingMessage } = await db
        .from("messages")
        .select(
          "id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256"
        )
        .eq("workspace_id", workspaceId)
        .eq("id", messageId)
        .single();
      if (existingMessage) {
        return withCookies(
          NextResponse.json(
            { ok: true, queued: true, idempotent: true, message: mapMessage(existingMessage) },
            { status: 202 }
          )
        );
      }
    }
  }

  const { data: inserted, error: insErr } = await db
    .from("messages")
    .insert({
      workspace_id: workspaceId,
      conversation_id: id,
      direction: "out",
      text: templateText,
      status: "queued",
    })
    .select(
      "id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256"
    )
    .single();

  if (insErr || !inserted) {
    return withCookies(NextResponse.json({ error: insErr?.message || "insert_failed" }, { status: 500 }));
  }

  const firstResponseAt = computeFirstResponseAt({
    firstResponseAt: conv.first_response_at ?? null,
    lastCustomerMessageAt: conv.last_customer_message_at ?? null,
    messageTs: inserted.ts,
  });

  await db
    .from("conversations")
    .update({
      last_message_at: inserted.ts,
      first_response_at: firstResponseAt ?? conv.first_response_at ?? null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", id);

  const nextAttemptAt = new Date().toISOString();
  const { data: outboxInsert, error: outboxErr } = await db
    .from("outbox_messages")
    .upsert(
      [
        {
          workspace_id: workspaceId,
          conversation_id: id,
          to_phone: toPhone,
          payload: {
            message_id: inserted.id,
            template_name: templateName,
            language,
            components,
          },
          idempotency_key: idempotencyKey,
          status: "queued",
          attempts: 0,
          next_run_at: nextAttemptAt,
          next_attempt_at: nextAttemptAt,
        },
      ],
      { onConflict: "idempotency_key" }
    )
    .select("id")
    .single();

  if (outboxErr) {
    return withCookies(
      NextResponse.json({ error: outboxErr.message || "outbox_insert_failed" }, { status: 500 })
    );
  }

  const { error: eventErr } = await db.from("message_events").insert({
    message_id: inserted.id,
    event_type: "send.queued",
    payload: { template_name: templateName, language, conversation_id: id, outbox_id: outboxInsert?.id },
  });
  if (eventErr) {
    console.log("message_events insert failed (send_queued)", eventErr.message);
  }

  const waSendEnabled = isTruthy(process.env.ENABLE_WA_SEND);
  const logPayload = {
    workspaceId,
    conversationId: id,
    messageId: inserted.id,
    outboxId: outboxInsert?.id ?? null,
    toPhone,
    templateName,
    language,
  };

  if (!waSendEnabled) {
    console.log("[WA_TEMPLATE_SEND] skipped (dry-run)", JSON.stringify(logPayload));
    return withCookies(
      NextResponse.json({ ok: true, queued: true, message: mapMessage(inserted) }, { status: 200 })
    );
  }

  console.log("[WA_TEMPLATE_SEND] attempting", JSON.stringify(logPayload));

  let sendError: string | null = null;
  let waMessageId: string | null = null;

  try {
    const res = await sendWhatsAppTemplate({
      to: toPhone,
      templateName,
      language,
      components,
    });
    waMessageId = extractWaMessageId(res.data);
  } catch (err: unknown) {
    sendError = toErrorMessage(err);
  }

  const nextStatus = sendError ? "failed" : "sent";
  const nowIso = new Date().toISOString();

  const { data: updatedMessage, error: updErr } = await db
    .from("messages")
    .update({
      status: nextStatus,
      wa_message_id: waMessageId,
      error_reason: sendError,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", inserted.id)
    .select(
      "id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256"
    )
    .single();

  if (updErr) {
    console.log("messages update failed (wa_template_send)", updErr.message);
  }

  if (outboxInsert?.id) {
    const { error: outboxUpdateErr } = await db
      .from("outbox_messages")
      .update({
        status: sendError ? "failed" : "sent",
        attempts: 1,
        last_error: sendError,
        updated_at: nowIso,
      })
      .eq("id", outboxInsert.id);

    if (outboxUpdateErr) {
      console.log("outbox_messages update failed (wa_template_send)", outboxUpdateErr.message);
    }
  }

  const { error: sendEventErr } = await db.from("message_events").insert({
    message_id: inserted.id,
    event_type: sendError ? "send.failed" : "send.sent",
    payload: sendError
      ? { error: sendError, template_name: templateName, language }
      : { wa_message_id: waMessageId, to: toPhone, template_name: templateName, language },
  });

  if (sendEventErr) {
    console.log("message_events insert failed (send_result)", sendEventErr.message);
  }

  if (sendError) {
    console.warn(
      "[WA_TEMPLATE_SEND] failed",
      JSON.stringify({ ...logPayload, error: sendError })
    );
  } else {
    console.log(
      "[WA_TEMPLATE_SEND] success",
      JSON.stringify({ ...logPayload, waMessageId })
    );
  }

  const finalMessage = (updatedMessage as MessageRow | null) ?? inserted;
  return withCookies(
    NextResponse.json(
      { ok: true, queued: false, message: mapMessage(finalMessage) },
      { status: 200 }
    )
  );
}
