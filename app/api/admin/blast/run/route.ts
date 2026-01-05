import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";

export const runtime = "nodejs";

const BATCH_SIZE = 50;
const THROTTLE_MS = 250;
const BACKOFF_MS = 1200;
const MAX_ATTEMPTS = 3;

type RecipientRow = {
  id: string;
  contact_id: string;
  to_phone: string;
  status: string;
};

type ContactConsentRow = {
  id: string;
  opted_in: boolean | null;
  opted_out: boolean | null;
};

type WhatsAppErrorResponse = {
  error?: {
    message?: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function sendWhatsAppTemplate(params: {
  to: string;
  templateName: string;
  language: string;
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
          components: [],
        },
      }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok) {
      const msg = getApiErrorMessage(data, `WA API failed (${res.status})`);
      return { ok: false as const, status: res.status, error: msg };
    }

    return { ok: true as const, status: res.status, data };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { searchParams } = req.nextUrl;
  const campaignId = searchParams.get("campaign_id") || "";

  if (!campaignId) {
    return withCookies(
      NextResponse.json({ error: "campaign_id_required" }, { status: 400 })
    );
  }

  const { data: campaign, error: campaignErr } = await db
    .from("campaigns")
    .select("id, workspace_id, template_name, language, status, started_at")
    .eq("workspace_id", workspaceId)
    .eq("id", campaignId)
    .single();

  if (campaignErr || !campaign) {
    return withCookies(
      NextResponse.json({ error: campaignErr?.message || "campaign_not_found" }, { status: 404 })
    );
  }

  const nowIso = new Date().toISOString();
  if (campaign.status !== "running") {
    await db
      .from("campaigns")
      .update({
        status: "running",
        started_at: campaign.started_at ?? nowIso,
      })
      .eq("id", campaignId);
  }

  const { data: recipients, error: recErr } = await db
    .from("campaign_recipients")
    .select("id, contact_id, to_phone, status")
    .eq("campaign_id", campaignId)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (recErr) {
    return withCookies(
      NextResponse.json({ error: recErr.message }, { status: 500 })
    );
  }

  const rows = (recipients ?? []) as RecipientRow[];
  if (rows.length === 0) {
    await db
      .from("campaigns")
      .update({ status: "finished", finished_at: nowIso })
      .eq("id", campaignId);
    return withCookies(NextResponse.json({ ok: true, processed: 0, queuedRemaining: 0 }));
  }

  const ids = rows.map((r) => r.id);
  await db
    .from("campaign_recipients")
    .update({ status: "processing", attempted_at: nowIso })
    .in("id", ids);

  const contactIds = rows.map((r) => r.contact_id);
  const { data: contactRows } = await db
    .from("contacts")
    .select("id, opted_in, opted_out")
    .in("id", contactIds);

  const consentMap = new Map<string, ContactConsentRow>();
  (contactRows ?? []).forEach((c: ContactConsentRow) => consentMap.set(c.id, c));

  let processed = 0;
  let dryRun = false;

  for (const recipient of rows) {
    const consent = consentMap.get(recipient.contact_id);
    if (!consent?.opted_in || consent?.opted_out) {
      await db
        .from("campaign_recipients")
        .update({
          status: "failed",
          error_reason: consent?.opted_out ? "opted_out" : "not_opted_in",
          attempted_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);
      processed += 1;
      continue;
    }

    if (!recipient.to_phone) {
      await db
        .from("campaign_recipients")
        .update({
          status: "failed",
          error_reason: "phone_missing",
          attempted_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);
      processed += 1;
      continue;
    }

    if (!isTruthy(process.env.ENABLE_WA_SEND)) {
      dryRun = true;
      await db
        .from("campaign_recipients")
        .update({
          status: "queued",
          error_reason: "dry_run",
          attempted_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);
      processed += 1;
      continue;
    }

    let attempt = 0;
    let sendError: string | null = null;
    let waMessageId: string | null = null;
    let statusCode: number | null = null;

    while (attempt < MAX_ATTEMPTS) {
      attempt += 1;
      const res = await sendWhatsAppTemplate({
        to: recipient.to_phone,
        templateName: campaign.template_name,
        language: campaign.language,
      });

      if (res.ok) {
        waMessageId = extractWaMessageId(res.data);
        sendError = null;
        statusCode = res.status;
        break;
      }

      sendError = res.error;
      statusCode = res.status;
      if (res.status === 429 && attempt < MAX_ATTEMPTS) {
        await sleep(BACKOFF_MS * attempt);
        continue;
      }
      break;
    }

    await db
      .from("campaign_recipients")
      .update({
        status: sendError ? "failed" : "sent",
        wa_message_id: waMessageId,
        error_reason: sendError,
        attempted_at: new Date().toISOString(),
      })
      .eq("id", recipient.id);

    if (sendError && statusCode) {
      console.log(
        "WA_BLAST_SEND_FAILED",
        JSON.stringify({ campaignId, recipientId: recipient.id, status: statusCode, error: sendError })
      );
    }

    processed += 1;
    await sleep(THROTTLE_MS);
  }

  const { count: queuedRemaining } = await db
    .from("campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "queued");
  if (queuedRemaining === 0 && !dryRun) {
    await db
      .from("campaigns")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", campaignId);
  }

  return withCookies(
    NextResponse.json({ ok: true, processed, queuedRemaining, dryRun })
  );
}
