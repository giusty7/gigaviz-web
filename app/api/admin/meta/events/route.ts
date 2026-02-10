import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";
import { normalizePhone } from "@/lib/contacts/normalize";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "Lead",
  "Purchase",
  "AddToCart",
  "QualifiedProspect",
]);

type MetaEventRow = {
  id: string;
  event_name: string;
  phone_e164: string | null;
  status: string;
  error: string | null;
  created_at: string;
  source: string;
};

type ContactRow = {
  id: string;
  phone: string | null;
  opted_in: boolean | null;
  opted_out: boolean | null;
};

type BodyPayload = {
  eventName?: unknown;
  phoneE164?: unknown;
  contactId?: unknown;
  source?: unknown;
  customData?: unknown;
};

type MetaGraphError = {
  message?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toE164(raw: string) {
  const digits = normalizePhone(raw);
  if (!digits) return "";
  return `+${digits}`;
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
    throw new Error("Invalid access token (contains whitespace)");
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

function buildMetaUrl(version: string, targetId: string) {
  return `https://graph.facebook.com/${version}/${targetId}/events`;
}

async function sendMetaEvent(params: {
  eventName: string;
  eventTime: string;
  phoneE164: string;
  source: string;
  customData?: Record<string, unknown> | null;
  consentStatus: string;
}) {
  const token = requiredEnvAny(
    ["WA_ACCESS_TOKEN", "WA_CLOUD_API_TOKEN", "WA_CLOUD_API_SYSTEM_USER_TOKEN"],
    { sanitizeToken: true }
  );
  const targetId =
    process.env.WA_WABA_ID || process.env.META_APP_ID || "";
  if (!targetId) {
    throw new Error("Missing WA_WABA_ID or META_APP_ID");
  }
  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
  const url = buildMetaUrl(version, targetId);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_name: params.eventName,
      event_time: params.eventTime,
      phone_e164: params.phoneE164,
      source: params.source,
      consent_status: params.consentStatus,
      custom_data: params.customData ?? {},
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: MetaGraphError;
  };
  if (!res.ok) {
    const message =
      typeof data?.error?.message === "string"
        ? data.error.message
        : `Meta API error (${res.status})`;
    const err = new Error(message) as Error & {
      code?: number;
      subcode?: number;
      fbtrace_id?: string;
      status?: number;
    };
    err.code = data?.error?.code;
    err.subcode = data?.error?.error_subcode;
    err.fbtrace_id = data?.error?.fbtrace_id;
    err.status = res.status;
    throw err;
  }

  return { url, data };
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const body = (await req.json().catch(() => ({}))) as BodyPayload;

  const eventName = asString(body.eventName);
  if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
    return withCookies(
      NextResponse.json({ error: "invalid_event_name" }, { status: 400 })
    );
  }

  const source = asString(body.source) || "inbox";
  const contactId = asString(body.contactId);
  const phoneInput = asString(body.phoneE164);
  const customData =
    body.customData && typeof body.customData === "object"
      ? (body.customData as Record<string, unknown>)
      : null;

  let contact: ContactRow | null = null;
  if (contactId) {
    const { data, error } = await db
      .from("contacts")
      .select("id, phone, opted_in, opted_out")
      .eq("workspace_id", workspaceId)
      .eq("id", contactId)
      .maybeSingle();
    if (error) {
      return withCookies(
        NextResponse.json({ error: error.message }, { status: 500 })
      );
    }
    contact = (data as ContactRow | null) ?? null;
  }

  const phoneRaw = phoneInput || contact?.phone || "";
  const phoneE164 = phoneRaw ? toE164(phoneRaw) : "";
  const consentStatus = contact
    ? contact.opted_out
      ? "opted_out"
      : contact.opted_in
        ? "opted_in"
        : "not_opted_in"
    : "unknown";

  if (!phoneE164) {
    return withCookies(
      NextResponse.json({ error: "phone_required" }, { status: 400 })
    );
  }

  const eventTime = new Date().toISOString();
  const metaRequest = {
    event_name: eventName,
    event_time: eventTime,
    phone_e164: phoneE164 || null,
    source,
    consent_status: consentStatus,
    custom_data: customData ?? {},
  };

  if (contact && consentStatus !== "opted_in") {
    const { data: inserted, error: insertErr } = await db
      .from("meta_events")
      .insert({
        workspace_id: workspaceId,
        recorded_by: user?.id ?? null,
        contact_id: contact.id,
        phone_e164: phoneE164 || null,
        source,
        event_name: eventName,
        event_time: eventTime,
        status: "failed",
        meta_request: metaRequest,
        error: consentStatus,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return withCookies(
        NextResponse.json({ error: insertErr?.message || "insert_failed" }, { status: 500 })
      );
    }

    return withCookies(
      NextResponse.json({ ok: false, eventId: inserted.id, status: "failed" }, { status: 403 })
    );
  }

  const { data: inserted, error: insertErr } = await db
    .from("meta_events")
    .insert({
      workspace_id: workspaceId,
      recorded_by: user?.id ?? null,
      contact_id: contact?.id ?? null,
      phone_e164: phoneE164 || null,
      source,
      event_name: eventName,
      event_time: eventTime,
      status: "recorded",
      meta_request: metaRequest,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return withCookies(
      NextResponse.json({ error: insertErr?.message || "insert_failed" }, { status: 500 })
    );
  }

  const eventId = inserted.id as string;
  let status = "recorded";

  if (isTruthy(process.env.ENABLE_META_EVENTS_SEND)) {
    try {
      const result = await sendMetaEvent({
        eventName,
        eventTime,
        phoneE164,
        source,
        customData,
        consentStatus,
      });
      status = "sent";
      await db
        .from("meta_events")
        .update({
          status: "sent",
          meta_response: result.data ?? {},
        })
        .eq("id", eventId);
    } catch (err: unknown) {
      const data = err as { message?: string; code?: number; subcode?: number; fbtrace_id?: string; status?: number };
      const message = data?.message || (err instanceof Error ? err.message : "Meta API error");
      const errorPayload = {
        message,
        code: data?.code ?? null,
        subcode: data?.subcode ?? null,
        fbtrace_id: data?.fbtrace_id ?? null,
        status: data?.status ?? null,
      };
      status = "failed";
      await db
        .from("meta_events")
        .update({
          status: "failed",
          meta_response: errorPayload,
          error: message,
        })
        .eq("id", eventId);
      logger.info(
        "META_EVENT_SEND_FAILED",
        JSON.stringify({ eventId, status: data?.status ?? null, error: message })
      );
    }
  }

  return withCookies(NextResponse.json({ ok: true, eventId, status }));
}

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { searchParams } = req.nextUrl;
  const rawLimit = Number(searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

  const { data, error } = await db
    .from("meta_events")
    .select("id, event_name, phone_e164, status, error, created_at, source")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  const items = (data ?? []) as MetaEventRow[];
  return withCookies(
    NextResponse.json({
      items,
      sendingEnabled: isTruthy(process.env.ENABLE_META_EVENTS_SEND),
    })
  );
}
